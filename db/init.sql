-- Florir PDV - Database Schema
-- Auto-executed by Docker Postgres on first run

-- 1. Funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
    idfuncionario SERIAL        PRIMARY KEY,
    nome          VARCHAR(50)   NOT NULL,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    senha         VARCHAR(100)  NOT NULL,
    cargo         VARCHAR(20)   NOT NULL CHECK(cargo IN ('vendedor','administrador','caixa')),
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE
);

-- 2. Categorias
CREATE TABLE IF NOT EXISTS categorias (
    idcategoria SERIAL       PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   VARCHAR(200) NULL
);

-- 3. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    idcliente   SERIAL      PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    cpf         VARCHAR(14)  UNIQUE,
    email       VARCHAR(100),
    telefone    VARCHAR(20),
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    datacriacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Produtos
CREATE TABLE IF NOT EXISTS produtos (
    idproduto     SERIAL        PRIMARY KEY,
    nome          VARCHAR(100)  NOT NULL,
    valorunitario DECIMAL(10,2) NOT NULL CHECK(valorunitario > 0.0),
    estoque       INTEGER       NOT NULL DEFAULT 0 CHECK(estoque >= 0),
    estoqueminimo INTEGER       NOT NULL DEFAULT 0 CHECK(estoqueminimo >= 0),
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    idcategoria   INTEGER       NOT NULL REFERENCES categorias(idcategoria)
);

-- 5. Pedidos (idcliente pode ser nulo — vendas sem um cliente são permitidas)
CREATE TABLE IF NOT EXISTS pedidos (
    idpedido       SERIAL        PRIMARY KEY,
    datahora       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valortotal     DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK(valortotal >= 0.0),
    status         VARCHAR(20)   NOT NULL DEFAULT 'aberto' CHECK(status IN ('aberto','finalizado','cancelado')),
    formapagamento VARCHAR(20)   NOT NULL CHECK(formapagamento IN ('pix','debito','credito','dinheiro')),
    idfuncionario  INTEGER       NOT NULL REFERENCES funcionarios(idfuncionario),
    idcliente      INTEGER       REFERENCES clientes(idcliente)
);

-- 6. ItensPedido
CREATE TABLE IF NOT EXISTS itenspedido (
    idpedido      INTEGER       NOT NULL REFERENCES pedidos(idpedido) ON DELETE CASCADE,
    idproduto     INTEGER       NOT NULL REFERENCES produtos(idproduto),
    quantidade    INTEGER       NOT NULL DEFAULT 1 CHECK(quantidade > 0),
    valorunitario DECIMAL(10,2) NOT NULL CHECK(valorunitario > 0.0),
    subtotal      DECIMAL(10,2) NOT NULL CHECK(subtotal > 0.0),
    PRIMARY KEY(idpedido, idproduto)
);

-- 7. EntradaEstoque
CREATE TABLE IF NOT EXISTS entradaestoque (
    identrada     SERIAL        PRIMARY KEY,
    quantidade    INTEGER       NOT NULL CHECK(quantidade > 0),
    precocusto    DECIMAL(10,2) NULL CHECK(precocusto > 0.0),
    datahora      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    observacao    VARCHAR(200)  NULL,
    idproduto     INTEGER       NOT NULL REFERENCES produtos(idproduto),
    idfuncionario INTEGER       NOT NULL REFERENCES funcionarios(idfuncionario)
);

---------------------------------------------------------------------------
-- TRIGGER
-- Dispara após cada linha inserida emitenspedido.
-- Reverte a inserção se o estoque ficar negativo.
---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_verificar_estoque_func()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM produtos p
        WHERE p.idproduto = NEW.idproduto AND p.estoque < 0
    ) THEN
        RAISE EXCEPTION 'Estoque insuficiente para um ou mais produtos';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verificar_estoque ON itenspedido;
CREATE TRIGGER trg_verificar_estoque
AFTER INSERT ON itenspedido
FOR EACH ROW EXECUTE FUNCTION trg_verificar_estoque_func();

---------------------------------------------------------------------------
-- PROCEDURE
-- Finaliza um pedido: atualiza status e forma de pagamento, e reduz o estoque dos produtos.
-- Em caso de erro (ex: estoque negativo), a transação é revertida e o pedido permanece aberto.
---------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_finalizar_pedido(
    p_idpedido       INT,
    p_formapagamento VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE pedidos
    SET status         = 'finalizado',
        formapagamento = p_formapagamento
    WHERE idpedido = p_idpedido;

    UPDATE produtos p
    SET estoque = p.estoque - ip.quantidade
    FROM itenspedido ip
    WHERE p.idproduto  = ip.idproduto
      AND ip.idpedido  = p_idpedido;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

---------------------------------------------------------------------------
-- VIEW
-- Resumo completo de cada venda, incluindo dados do pedido, cliente, vendedor e itens.
---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_resumo_vendas AS
SELECT
    p.idpedido,
    p.datahora,
    p.status,
    p.formapagamento,
    p.valortotal,
    p.idcliente,
    f.nome   AS nomevendedor,
    f.cargo  AS cargovendedor,
    cl.nome  AS nomecliente,
    pr.idproduto,
    pr.nome  AS nomeproduto,
    c.nome   AS nomecategoria,
    ip.quantidade,
    ip.valorunitario,
    ip.subtotal
FROM pedidos p
INNER JOIN funcionarios f ON p.idfuncionario = f.idfuncionario
LEFT  JOIN clientes cl    ON p.idcliente     = cl.idcliente
LEFT  JOIN itenspedido ip ON p.idpedido      = ip.idpedido
LEFT  JOIN produtos pr    ON ip.idproduto    = pr.idproduto
LEFT  JOIN categorias c   ON pr.idcategoria  = c.idcategoria;

---------------------------------------------------------------------------
-- FUNCTION
-- Retorna produtos com estoque abaixo do mínimo, incluindo a quantidade faltante para reposição.
-- Utilizada para alertar o administrador sobre itens que precisam ser reabastecidos.
---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_produtos_estoque_baixo()
RETURNS TABLE (
    idproduto          INT,
    nome               VARCHAR,
    estoqueatual       INT,
    estoqueminimo      INT,
    quantidadefaltante INT,
    categoria          VARCHAR
)
LANGUAGE sql
AS $$
    SELECT
        p.idproduto,
        p.nome,
        p.estoque                   AS estoqueatual,
        p.estoqueminimo,
        p.estoqueminimo - p.estoque AS quantidadefaltante,
        c.nome                      AS categoria
    FROM produtos p
    INNER JOIN categorias c ON p.idcategoria = c.idcategoria
    WHERE p.estoque < p.estoqueminimo
      AND p.ativo = TRUE;
$$;

---------------------------------------------------------------------------
-- INSERCAO DE DADOS
---------------------------------------------------------------------------

-- Funcionarios (Adicionar administradores do aplicativo nos IDs 11 e 12 para preservar as referências de Chave Estrangeira (FK) do arquivo test.sql)
INSERT INTO funcionarios (idfuncionario, nome, email, senha, cargo, ativo) VALUES
    (1,  'Administrador',   'florirtanabi@gmail.com', 'adm2026',     'administrador', true),
    (2,  'Barbara Okasaki', 'barbara@florir.com',      'vendedor123', 'vendedor',      true),
    (3,  'Bruno Costa',     'bruno@florir.com',        'vendedor123', 'vendedor',      true),
    (4,  'Carla Mendes',    'carla@florir.com',        'caixa123',    'caixa',         true),
    (5,  'Diego Lima',      'diego@florir.com',        'vendedor123', 'vendedor',      true),
    (6,  'Elisa Rocha',     'elisa@florir.com',        'vendedor123', 'vendedor',      true),
    (7,  'Fernanda Souza',  'fernanda@florir.com',     'caixa123',    'caixa',         true),
    (8,  'Gabriel Nunes',   'gabriel@florir.com',      'vendedor123', 'vendedor',      false),
    (9,  'Helena Torres',   'helena@florir.com',       'vendedor123', 'vendedor',      true),
    (10, 'Igor Pinto',      'igor@florir.com',         'vendedor123', 'vendedor',      true),
    (11, 'Efraim',          'efraimwss@gmail.com',     'admin123',    'administrador', true),
    (12, 'Super Admin',     'admin@gmail.com',         'admin123',    'administrador', true)
ON CONFLICT (idfuncionario) DO NOTHING; -- Se tentar inserir um valor de idfuncionario já existente, ignora a inserção (útil para re-execução do script sem erros)

-- Categorias
INSERT INTO categorias (idcategoria, nome, descricao) VALUES
    (1,  'Flores',     'Flores naturais e artificiais'),
    (2,  'Arranjos',   'Arranjos e buquês prontos'),
    (3,  'Vasos',      'Vasos e cachepots decorativos'),
    (4,  'Plantas',    'Plantas ornamentais'),
    (5,  'Sementes',   'Sementes e bulbos'),
    (6,  'Acessórios', 'Fitas, embalagens e decorações'),
    (7,  'Suculentas', 'Suculentas e cactos'),
    (8,  'Orquídeas',  'Orquídeas e bromélias'),
    (9,  'Coroas',     'Coroas e arranjos fúnebres'),
    (10, 'Presentes',  'Kits e cestas de presente')
ON CONFLICT (idcategoria) DO NOTHING;

-- Produtos
INSERT INTO produtos (idproduto, nome, valorunitario, estoque, estoqueminimo, ativo, idcategoria) VALUES
    (1,  'Rosa Vermelha',          5.00,   100, 20, true,  1),
    (2,  'Girassol',               4.50,    80, 15, true,  1),
    (3,  'Tulipa Amarela',         6.00,    60, 10, true,  1),
    (4,  'Buquê Romântico',       85.00,    20,  5, true,  2),
    (5,  'Arranjo Primavera',    120.00,    15,  3, true,  2),
    (6,  'Vaso de Cerâmica',      35.00,    30,  5, true,  3),
    (7,  'Orquídea Phalaenopsis', 75.00,    25,  5, true,  8),
    (8,  'Suculenta Mini',        12.00,    50, 10, true,  7),
    (9,  'Lírio Branco',           7.00,     8, 15, true,  1),
    (10, 'Kit Presente Floral',  150.00,    10,  3, true, 10)
ON CONFLICT (idproduto) DO NOTHING;

-- Pedidos
INSERT INTO pedidos (idpedido, datahora, valortotal, status, formapagamento, idfuncionario) VALUES
    (1,  '2026-05-01 09:00:00+00',  85.00, 'finalizado', 'pix',      2),
    (2,  '2026-05-02 10:30:00+00', 120.00, 'finalizado', 'credito',  2),
    (3,  '2026-05-03 11:00:00+00',  45.00, 'finalizado', 'dinheiro', 3),
    (4,  '2026-05-04 14:00:00+00',  75.00, 'finalizado', 'debito',   4),
    (5,  '2026-05-05 15:30:00+00', 150.00, 'finalizado', 'pix',      2),
    (6,  '2026-05-06 09:45:00+00',  35.00, 'finalizado', 'dinheiro', 3),
    (7,  '2026-05-07 16:00:00+00', 240.00, 'finalizado', 'credito',  2),
    (8,  '2026-05-08 10:00:00+00',  60.00, 'cancelado',  'pix',      4),
    (9,  '2026-05-09 11:30:00+00',  90.00, 'finalizado', 'debito',   2),
    (10, '2026-05-10 13:00:00+00', 175.00, 'finalizado', 'pix',      3)
ON CONFLICT (idpedido) DO NOTHING;

-- ItensPedido
INSERT INTO itenspedido (idpedido, idproduto, quantidade, valorunitario, subtotal) VALUES
    (1,  1,  10, 5.00,   50.00),
    (1,  4,   1, 85.00,  85.00),
    (2,  5,   1, 120.00, 120.00),
    (3,  2,  10, 4.50,   45.00),
    (4,  7,   1, 75.00,  75.00),
    (5,  10,  1, 150.00, 150.00),
    (6,  6,   1, 35.00,  35.00),
    (7,  5,   2, 120.00, 240.00),
    (9,  3,  10, 6.00,   60.00),
    (10, 4,   1, 85.00,  85.00)
ON CONFLICT (idpedido, idproduto) DO NOTHING;


-- Clientes
INSERT INTO clientes (nome, cpf, email, telefone, ativo, datacriacao) VALUES
('Luciene Cavalcanti', '334.454.235-23', 'luciene.cavalcanti@gmail.com', '(17) 91929-0021', true, NOW()),
('Beatriz Oliveira', '234.567.890-12', 'beatriz.oliveira@gmail.com', '(17) 99123-4567', true, NOW()),
('Carlos Eduardo Santos', '345.678.901-23', 'carlos.eduardo@gmail.com', '(11) 97654-3210', true, NOW()),
('Daniela Rodrigues', '456.789.012-34', 'daniela.rodri@gmail.com', '(17) 98111-2233', true, NOW()),
('Eduardo Ferreira', '567.890.123-45', 'edu.ferreira@gmail.com', '(11) 96543-2109', true, NOW()),
('Fernanda Costa', '678.990.123-56', 'fernanda.costa@gmail.com', '(17) 99222-3344', true, NOW()),
('Gabriel Almeida', '789.012.345-67', 'gabriel.almeida@gmail.com', '(11) 95432-1098', true, NOW()),
('Heloísa Souza', '890.123.456-78', 'heloisa.souza@gmail.com', '(17) 98333-4455', true, NOW()),
('Igor Martins', '901.234.567-89', 'igor.martins@gmail.com', '(11) 94321-0987', true, NOW()),
('Juliana Mendes', '012.345.678-90', 'juliana.mendes@gmail.com', '(17) 99444-5566', true, NOW());
ON CONFLICT (cpf) DO NOTHING;


-- EntradaEstoque
INSERT INTO entradaestoque (quantidade, precocusto, datahora, observacao, idproduto, idfuncionario) VALUES
    (50, 2.50,  '2026-04-28 08:00:00+00', 'Reposição semanal', 1,  1),
    (40, 2.00,  '2026-04-28 08:30:00+00', 'Reposição semanal', 2,  1),
    (30, 3.00,  '2026-04-29 09:00:00+00', NULL,                3,  2),
    (10, 45.00, '2026-04-29 09:30:00+00', 'Pedido especial',   4,  2),
    (10, 60.00, '2026-04-30 10:00:00+00', NULL,                5,  1),
    (20, 18.00, '2026-04-30 10:30:00+00', NULL,                6,  1),
    (15, 40.00, '2026-05-01 08:00:00+00', 'Lote novo',         7,  2),
    (30, 6.00,  '2026-05-01 08:30:00+00', NULL,                8,  1),
    (20, 3.50,  '2026-05-02 09:00:00+00', 'Urgente',           9,  2),
    (10, 80.00, '2026-05-02 09:30:00+00', NULL,                10, 1)
ON CONFLICT DO NOTHING;

-- Resetar as sequências para os próximos inserts 
SELECT setval('funcionarios_idfuncionario_seq', (SELECT MAX(idfuncionario) FROM funcionarios));
SELECT setval('categorias_idcategoria_seq',     (SELECT MAX(idcategoria)   FROM categorias));
SELECT setval('produtos_idproduto_seq',         (SELECT MAX(idproduto)     FROM produtos));
SELECT setval('pedidos_idpedido_seq',           (SELECT MAX(idpedido)      FROM pedidos));
SELECT setval('entradaestoque_identrada_seq',   (SELECT MAX(identrada)     FROM entradaestoque));
