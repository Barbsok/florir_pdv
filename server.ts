/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { sql, isDatabaseConfigured } from "./server/db";

dotenv.config();

const app = express();
const PORT = 3030;

app.use(express.json());

app.use("/api", (_, res, next) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({ error: "Banco de dados não configurado." });
  }
  next();
});

async function getAllDbState() {
  const rawProducts = await sql`
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.idcategoria = c.idcategoria
    ORDER BY p.idproduto ASC
  `;

  const rawVendas = await sql`SELECT * FROM vw_resumo_vendas ORDER BY datahora DESC`;

  const rawEntries = await sql`
    SELECT e.*, pr.nome AS produto_nome, f.nome AS funcionario_nome
    FROM entradaestoque e
    LEFT JOIN produtos pr ON e.idproduto = pr.idproduto
    LEFT JOIN funcionarios f ON e.idfuncionario = f.idfuncionario
    ORDER BY e.datahora DESC
  `;

  const mapPaymentMethod = (pm: string): string => {
    switch (pm?.toLowerCase()) {
      case "pix":
        return "Pix";
      case "debito":
        return "Débito";
      case "credito":
        return "Crédito";
      case "dinheiro":
        return "Dinheiro";
      default:
        return pm || "Dinheiro";
    }
  };

  const products = rawProducts.map((p: any) => ({
    id: String(p.idproduto),
    name: p.nome,
    category: p.categoria_nome || "Sem Categoria",
    stock: Number(p.estoque),
    minStock: Number(p.estoqueminimo),
    price: Number(p.valorunitario),
    ativo: p.ativo !== false,
  }));

  const salesMap = new Map<number, any>();
  for (const row of rawVendas) {
    const id = Number(row.idpedido);
    if (!salesMap.has(id)) {
      salesMap.set(id, {
        id: String(id),
        paymentMethod: mapPaymentMethod(row.formapagamento),
        total: Number(row.valortotal),
        date: new Date(row.datahora).toISOString(),
        clienteId: row.idcliente ? Number(row.idcliente) : undefined,
        clienteNome: row.nomecliente || undefined,
        items: [],
      });
    }
    if (row.idproduto) {
      salesMap.get(id).items.push({
        productId: String(row.idproduto),
        name: row.nomeproduto || "Produto",
        quantity: Number(row.quantidade),
        price: Number(row.valorunitario),
        subtotal: Number(row.subtotal),
      });
    }
  }
  const sales = Array.from(salesMap.values());

  const stockEntries = rawEntries.map((e: any) => ({
    id: String(e.identrada),
    productId: String(e.idproduto),
    productName: e.produto_nome || "Produto",
    quantity: Number(e.quantidade),
    costPrice: e.precocusto ? Number(e.precocusto) : undefined,
    employee: e.funcionario_nome || "Funcionário",
    date: new Date(e.datahora).toISOString(),
    observations: e.observacao || undefined,
  }));

  return { products, sales, stockEntries };
}

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "E-mail e senha são obrigatórios" });
  }

  try {
    const users = await sql`
      SELECT * FROM funcionarios
      WHERE email = ${email} AND senha = ${password} AND ativo = true
      LIMIT 1
    `;

    if (users.length === 0) {
      return res
        .status(401)
        .json({
          success: false,
          error: "E-mail ou senha incorretos ou funcionário inativo.",
        });
    }
    const u = users[0];
    res.json({
      success: true,
      user: { email: u.email, name: u.nome, role: u.cargo },
    });
  } catch (err) {
    console.error("Login database error:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Erro interno ao autenticar no banco de dados",
      });
  }
});

// Bootstrap — load all data on frontend startup
app.get("/api/bootstrap", async (_, res) => {
  try {
    const [data, lowStock] = await Promise.all([
      getAllDbState(),
      sql`SELECT * FROM fn_produtos_estoque_baixo()`,
    ]);
    res.json({ usingFallback: false, ...data, lowStockProducts: lowStock });
  } catch (err) {
    console.error("Database read failed:", err);
    res.status(500).json({ error: "Erro ao carregar dados do banco de dados." });
  }
});

// Low stock products via DB function
app.get("/api/products/low-stock", async (_, res) => {
  try {
    const rows = await sql`SELECT * FROM fn_produtos_estoque_baixo()`;
    res.json({ products: rows });
  } catch (err) {
    console.error("Error fetching low-stock products:", err);
    res.status(500).json({ error: "Erro ao buscar produtos com estoque baixo." });
  }
});

// Create sale
app.post("/api/sales", async (req, res) => {
  const { sale, employeeEmail } = req.body;

  if (!sale || !sale.items) {
    return res.status(400).json({ error: "Falta informações da venda" });
  }

  try {
    let idFuncionario = 1;
    if (employeeEmail) {
      const funcResult = await sql`
        SELECT idfuncionario FROM funcionarios WHERE email = ${employeeEmail} LIMIT 1
      `;
      if (funcResult.length > 0) idFuncionario = funcResult[0].idfuncionario;
    }

    const mapPaymentMethodToDb = (method: string): string => {
      switch (method?.toLowerCase()) {
        case "pix":
          return "pix";
        case "débito":
        case "debito":
          return "debito";
        case "crédito":
        case "credito":
          return "credito";
        case "dinheiro":
          return "dinheiro";
        default:
          return "dinheiro";
      }
    };
    const paymentDb = mapPaymentMethodToDb(sale.paymentMethod);
    const idClienteDb = sale.clienteId
      ? parseInt(String(sale.clienteId), 10)
      : null;

    const insertPedido = await sql`
      INSERT INTO pedidos (valortotal, status, formapagamento, idfuncionario, idcliente)
      VALUES (${sale.total}, 'aberto', ${paymentDb}, ${idFuncionario}, ${idClienteDb})
      RETURNING idpedido
    `;

    if (insertPedido.length === 0)
      throw new Error("Erro ao criar pedido principal");
    const idpedido = insertPedido[0].idpedido;

    for (const item of sale.items) {
      await sql`
        INSERT INTO itenspedido (idpedido, idproduto, quantidade, valorunitario, subtotal)
        VALUES (${idpedido}, ${parseInt(item.productId, 10)}, ${item.quantity}, ${item.price}, ${item.subtotal})
      `;
    }

    await sql`CALL sp_finalizar_pedido(${idpedido}, ${paymentDb})`;

    const [data, lowStock] = await Promise.all([
      getAllDbState(),
      sql`SELECT * FROM fn_produtos_estoque_baixo()`,
    ]);
    res.json({
      success: true,
      usingFallback: false,
      products: data.products,
      sales: data.sales,
      lowStockProducts: lowStock,
    });
  } catch (err: any) {
    console.error("Error committing sale transaction:", err);
    res
      .status(500)
      .json({
        error: err?.message || "Erro ao salvar a venda no banco de dados",
      });
  }
});

// Create stock entry
app.post("/api/stock-entries", async (req, res) => {
  const { entry, employeeEmail } = req.body;

  if (!entry || !entry.productId) {
    return res
      .status(400)
      .json({ error: "Falta campos obrigatórios no abastecimento" });
  }

  try {
    let idFuncionario = 1;
    if (employeeEmail) {
      const funcResult = await sql`
        SELECT idfuncionario FROM funcionarios WHERE email = ${employeeEmail} LIMIT 1
      `;
      if (funcResult.length > 0) idFuncionario = funcResult[0].idfuncionario;
    } else if (entry.employee) {
      const funcResult = await sql`
        SELECT idfuncionario FROM funcionarios WHERE LOWER(nome) LIKE LOWER(${"%" + entry.employee + "%"}) LIMIT 1
      `;
      if (funcResult.length > 0) idFuncionario = funcResult[0].idfuncionario;
    }

    const prodIdInt = parseInt(entry.productId, 10);

    await sql`
      INSERT INTO entradaestoque (quantidade, precocusto, observacao, idproduto, idfuncionario)
      VALUES (${entry.quantity}, ${entry.costPrice ?? null}, ${entry.observations ?? null}, ${prodIdInt}, ${idFuncionario})
    `;

    await sql`UPDATE produtos SET estoque = estoque + ${entry.quantity} WHERE idproduto = ${prodIdInt}`;

    const [data, lowStock] = await Promise.all([
      getAllDbState(),
      sql`SELECT * FROM fn_produtos_estoque_baixo()`,
    ]);
    res.json({
      success: true,
      usingFallback: false,
      products: data.products,
      stockEntries: data.stockEntries,
      lowStockProducts: lowStock,
    });
  } catch (err) {
    console.error("Error committing stock entry transaction:", err);
    res
      .status(500)
      .json({
        error: "Erro ao salvar o abastecimento de estoque no banco de dados",
      });
  }
});

// List users
app.get("/api/config/users", async (req, res) => {
  try {
    const users = await sql`
      SELECT idfuncionario, nome, email, cargo, ativo FROM funcionarios ORDER BY idfuncionario ASC
    `;
    const mappedUsers = users.map((u: any) => ({ ...u, id: u.idfuncionario }));
    res.json({ success: true, users: mappedUsers });
  } catch (err) {
    console.error("Error fetching users:", err);
    res
      .status(500)
      .json({ error: "Erro ao buscar usuários do banco de dados" });
  }
});

// Create user
app.post("/api/config/users", async (req, res) => {
  const { nome, email, senha, cargo, ativo } = req.body;
  if (!nome || !email || !senha || !cargo) {
    return res
      .status(400)
      .json({ error: "Preencha todos os campos obrigatórios" });
  }

  try {
    const result = await sql`
      INSERT INTO funcionarios (nome, email, senha, cargo, ativo)
      VALUES (${nome}, ${email}, ${senha}, ${cargo}, ${ativo !== false})
      RETURNING idfuncionario, nome, email, cargo, ativo
    `;
    const mappedUser =
      result.length > 0 ? { ...result[0], id: result[0].idfuncionario } : null;
    res.json({ success: true, user: mappedUser });
  } catch (err: any) {
    console.error("Error creating user:", err);
    const msg =
      err.code === "23505"
        ? "Este e-mail já está cadastrado."
        : "Erro ao criar usuário.";
    res.status(500).json({ error: msg });
  }
});

// List customers
app.get("/api/config/customers", async (req, res) => {
  try {
    const customers = await sql`
      SELECT idcliente, nome, cpf, email, telefone, ativo, datacriacao FROM clientes ORDER BY idcliente ASC
    `;
    const mappedCustomers = customers.map((c: any) => ({
      ...c,
      id: c.idcliente,
    }));
    res.json({ success: true, customers: mappedCustomers });
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.json({ success: true, customers: [] });
  }
});

// Create customer
app.post("/api/config/customers", async (req, res) => {
  const { nome, cpf, email, telefone, ativo } = req.body;
  if (!nome) {
    return res.status(400).json({ error: "O nome do cliente é obrigatório" });
  }

  try {
    const result = await sql`
      INSERT INTO clientes (nome, cpf, email, telefone, ativo)
      VALUES (${nome}, ${cpf || null}, ${email || null}, ${telefone || null}, ${ativo !== false})
      RETURNING idcliente, nome, cpf, email, telefone, ativo, datacriacao
    `;
    const mappedCustomer =
      result.length > 0 ? { ...result[0], id: result[0].idcliente } : null;
    res.json({ success: true, customer: mappedCustomer });
  } catch (err: any) {
    console.error("Error creating customer:", err);
    const msg =
      err.code === "23505"
        ? "Este CPF já está cadastrado."
        : "Erro ao cadastrar cliente.";
    res.status(500).json({ error: msg });
  }
});

// Create product
app.post("/api/products", async (req, res) => {
  const { name, category, price, stock, minStock } = req.body;
  if (
    !name ||
    !category ||
    price === undefined ||
    stock === undefined ||
    minStock === undefined
  ) {
    return res
      .status(400)
      .json({ error: "Preencha todos os campos obrigatórios." });
  }

  const numericPrice = Number(price);
  const numericStock = Number(stock);
  const numericMinStock = Number(minStock);

  if (isNaN(numericPrice) || numericPrice <= 0) {
    return res
      .status(400)
      .json({ error: "O preço deve ser um número maior que zero." });
  }
  if (isNaN(numericStock) || numericStock < 0) {
    return res
      .status(400)
      .json({ error: "O estoque deve ser um número maior ou igual a zero." });
  }
  if (isNaN(numericMinStock) || numericMinStock < 0) {
    return res
      .status(400)
      .json({
        error: "O estoque mínimo deve ser um número maior ou igual a zero.",
      });
  }

  try {
    const cleanCategory = category.trim();
    const existingCat = await sql`
      SELECT idcategoria FROM categorias WHERE LOWER(nome) = LOWER(${cleanCategory}) LIMIT 1
    `;

    let categoryId: number;
    if (existingCat.length > 0) {
      categoryId = existingCat[0].idcategoria;
    } else {
      const insertedCat = await sql`
        INSERT INTO categorias (nome, descricao)
        VALUES (${cleanCategory}, ${`Categoria criada automaticamente para ${name}`})
        RETURNING idcategoria
      `;
      categoryId = insertedCat.length > 0 ? insertedCat[0].idcategoria : 1;
    }

    await sql`
      INSERT INTO produtos (nome, valorunitario, estoque, estoqueminimo, ativo, idcategoria)
      VALUES (${name}, ${numericPrice}, ${numericStock}, ${numericMinStock}, true, ${categoryId})
    `;

    const data = await getAllDbState();
    res.json({ success: true, products: data.products });
  } catch (err) {
    console.error("Error creating product:", err);
    res
      .status(500)
      .json({ error: "Erro ao cadastrar produto no banco de dados." });
  }
});

// Toggle product active status
app.put("/api/products/:id/toggle-active", async (req, res) => {
  const { id } = req.params;

  try {
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ error: "ID de produto inválido." });

    await sql`UPDATE produtos SET ativo = NOT ativo WHERE idproduto = ${idInt}`;

    const data = await getAllDbState();
    res.json({ success: true, products: data.products });
  } catch (err) {
    console.error("Error toggling product active state:", err);
    res
      .status(500)
      .json({
        error: "Erro ao modificar status do produto no banco de dados.",
      });
  }
});

// Toggle employee active status
app.put("/api/config/users/:id/toggle-active", async (req, res) => {
  const { id } = req.params;

  try {
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ error: "ID de funcionário inválido." });

    await sql`UPDATE funcionarios SET ativo = NOT ativo WHERE idfuncionario = ${idInt}`;

    const users = await sql`
      SELECT idfuncionario, nome, email, cargo, ativo FROM funcionarios ORDER BY idfuncionario ASC
    `;
    const mappedUsers = users.map((u: any) => ({ ...u, id: u.idfuncionario }));
    res.json({ success: true, users: mappedUsers });
  } catch (err) {
    console.error("Error toggling employee active state:", err);
    res.status(500).json({ error: "Erro ao modificar status do funcionário." });
  }
});

// Toggle customer active status
app.put("/api/config/customers/:id/toggle-active", async (req, res) => {
  const { id } = req.params;

  try {
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ error: "ID de cliente inválido." });

    await sql`UPDATE clientes SET ativo = NOT ativo WHERE idcliente = ${idInt}`;

    const customers = await sql`
      SELECT idcliente, nome, cpf, email, telefone, ativo, datacriacao FROM clientes ORDER BY idcliente ASC
    `;
    const mappedCustomers = customers.map((c: any) => ({
      ...c,
      id: c.idcliente,
    }));
    res.json({ success: true, customers: mappedCustomers });
  } catch (err) {
    console.error("Error toggling customer active state:", err);
    res.status(500).json({ error: "Erro ao modificar status do cliente." });
  }
});

// Serve frontend
async function init() {
  if (!isDatabaseConfigured()) {
    console.warn("WARNING: DATABASE_URL is not set. All /api requests will return 503.");
  } else {
    console.log("PostgreSQL database configured successfully!");
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🌸 Flora PDV full-stack server running on http://0.0.0.0:${PORT}`,
    );
  });
}

init();
