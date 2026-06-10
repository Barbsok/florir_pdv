# Flora PDV

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/licença-MIT-green)

## Sobre o Projeto

O **Flora PDV** é um sistema de Ponto de Venda (PDV) full-stack desenvolvido para floriculturas e pequenos comércios. A aplicação cobre todo o fluxo de operação da loja: autenticação de funcionários, cadastro de produtos e clientes, controle de estoque, registro de vendas (com diferentes formas de pagamento) e visualização de estatísticas — tudo a partir de uma interface web única, integrada a um banco de dados PostgreSQL.

## Stack de Tecnologias

| Camada        | Tecnologia                                                       |
|---------------|------------------------------------------------------------------|
| Frontend      | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion   |
| Backend       | Node.js, Express, TypeScript (executado via `tsx` / `esbuild`)   |
| Banco de Dados| PostgreSQL 16 (driver [`postgres`](https://github.com/porsager/postgres)) |
| Infraestrutura| Docker e Docker Compose                                          |
| Agendamento   | `node-cron` para rotinas automatizadas de backup                 |
| IA (opcional) | Google Gemini (`@google/genai`)                                  |

A organização do backend segue uma arquitetura em camadas dentro de `server/`:

```
server/
├── controllers/    # Recebem as requisições HTTP
├── services/       # Regras de negócio
├── repositories/   # Acesso ao banco de dados
├── models/         # Tipagens e contratos
├── routes/         # Definição dos endpoints REST
└── middlewares/    # Camadas transversais (ex.: dbCheck)
```

## Banco de Dados

O Flora PDV utiliza **PostgreSQL 16** como banco de dados principal. A escolha se deve à robustez transacional do Postgres (essencial para garantir consistência entre vendas e estoque), ao seu suporte nativo a *stored procedures*, *triggers* e *views*, e à ampla disponibilidade em ambientes Docker.

O schema é definido em [`db/init.sql`](db/init.sql) e aplicado automaticamente no primeiro start do contêiner Postgres. Principais entidades:

- **funcionarios** — usuários do sistema (vendedor, caixa, administrador).
- **categorias** e **produtos** — catálogo da loja, com controle de estoque e estoque mínimo.
- **clientes** — base de clientes (com CPF único e opcional).
- **pedidos** + **itenspedido** — vendas e seus itens, com status (`aberto`, `finalizado`, `cancelado`) e forma de pagamento (`pix`, `debito`, `credito`, `dinheiro`).
- **entradaestoque** — histórico de reposições de estoque.

Além das tabelas, o schema inclui:

- *Trigger* `trg_verificar_estoque` — impede que itens de pedido deixem o estoque negativo.
- *Procedure* `sp_finalizar_pedido` — finaliza um pedido e abate o estoque em uma única transação.
- *View* `vw_resumo_vendas` — visão consolidada das vendas com cliente, vendedor e produtos.
- *Function* `fn_produtos_estoque_baixo` — lista produtos abaixo do estoque mínimo.

## Interface

A interface é uma **aplicação web SPA** construída com React 19 + TypeScript e estilizada com Tailwind CSS. O backend Express serve o frontend (via Vite em desenvolvimento ou arquivos estáticos em produção) e expõe a API REST sob `/api`.

Principais telas (`src/components/`):

- **LoginPage** — autenticação dos funcionários.
- **Dashboard** — visão geral diária da operação.
- **NewSale** — fluxo de venda no caixa, com seleção de produtos, cliente opcional e forma de pagamento.
- **Stock** e **StockEntry** — consulta e lançamento de entradas de estoque.
- **Statistics** — gráficos e indicadores de desempenho.
- **Settings** — configurações da loja e do sistema.

A navegação acontece por uma **Sidebar** persistente, com transições animadas (`motion`) e layout pensado para uso em tablets no balcão de atendimento.

## Rotinas de Backup

O Flora PDV implementa **rotinas de backup automáticas e manuais** do banco PostgreSQL. Toda a lógica está concentrada em três arquivos:

- [`server/services/backupService.ts`](server/services/backupService.ts) — agendamento automático via `node-cron`.
- [`scripts/backup.sh`](scripts/backup.sh) — backup manual.
- [`scripts/restore.sh`](scripts/restore.sh) — restauração.

### Quando os backups são executados

- **Automático:** ao iniciar o servidor, `initBackupSchedule()` registra um job `cron` com a expressão `0 2 * * *`, ou seja, **todos os dias às 02:00** da máquina onde o backend está rodando. O agendamento só é ativado quando há `DATABASE_URL` configurado (ver `server/app.ts`).
- **Manual:** a qualquer momento, executando `npm run backup`.

### O que é salvo

Os backups são *dumps* SQL completos, gerados com `pg_dump --clean --if-exists`. Isso significa que cada arquivo contém:

- Todos os comandos `DROP ... IF EXISTS` necessários antes de recriar objetos.
- O schema completo (tabelas, *triggers*, *procedures*, *views*, *functions*).
- Todos os dados (`INSERT`s) das tabelas do banco `flora_pdv`.

Em outras palavras, cada arquivo `.sql` é um snapshot **autocontido** do banco no momento do backup.

### Onde os arquivos são armazenados

Os backups são salvos no diretório `backups/` na raiz do projeto, com o nome:

```
backups/backup_AAAA-MM-DD_HH-MM-SS.sql
```

Exemplo real: `backups/backup_2026-06-09_21-26-32.sql`.

O serviço automático mantém apenas os **7 backups mais recentes** (constante `MAX_BACKUPS` em `backupService.ts`). Arquivos antigos são removidos a cada execução bem-sucedida via `pruneOldBackups()`. Os backups manuais (`scripts/backup.sh`) não fazem essa rotação — eles apenas adicionam novos arquivos.

> Atenção: o diretório `backups/` está no sistema de arquivos local do host. Em produção, recomenda-se replicá-lo para um storage externo (S3, GCS, NFS, etc.).

### Como restaurar um backup

O script `scripts/restore.sh` faz o trabalho. Por padrão ele restaura o backup mais recente:

```bash
npm run restore
```

Para restaurar um arquivo específico, basta passar o caminho como argumento:

```bash
npm run restore -- backups/backup_2026-06-09_21-26-32.sql
```

Internamente o script roda:

```bash
docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB" < "$BACKUP_FILE"
```

Como os dumps usam `--clean --if-exists`, o banco é redefinido antes da restauração — **toda a base atual será sobrescrita**. Faça um backup manual imediatamente antes de restaurar se quiser preservar o estado vigente.

### Boas práticas recomendadas

- **Backup antes de restaurar:** sempre execute `npm run backup` antes de um `npm run restore` em produção.
- **Armazenamento externo:** sincronize o diretório `backups/` com um serviço de armazenamento remoto (S3, GCS, rsync para servidor externo). Backups apenas no mesmo disco do banco não protegem contra falhas físicas.
- **Teste de restauração periódico:** uma vez por mês, restaure o backup mais recente em um ambiente de homologação para validar que o arquivo realmente funciona.
- **Variáveis de ambiente:** garanta que `POSTGRES_USER` e `POSTGRES_DB` estejam definidos no `.env` antes de rodar os scripts — eles dependem dessas variáveis.
- **Fuso horário:** o agendamento `0 2 * * *` segue o fuso horário do contêiner do backend. Se ele rodar em UTC, o backup das 02:00 UTC equivale a 23:00 do dia anterior em horário de Brasília. Ajuste o `TZ` do contêiner se quiser horário local.
- **Monitoramento:** acompanhe os logs `[backup] Created: ...` e `[backup] Failed: ...` para identificar falhas no agendamento.

## Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) e Docker Compose
- npm (incluído na instalação do Node.js)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/Barbsok/florir_pdv.git
cd florir_pdv

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite .env conforme necessário

# 4. Suba a aplicação completa (app + Postgres) via Docker
npm run docker:up
```

A aplicação ficará disponível em **http://localhost:3030**.

### Execução em modo desenvolvimento

```bash
# Sobe somente o Postgres
docker compose up postgres

# Em outro terminal, inicia o backend + Vite com hot reload
npm run dev
```

## Exemplos de Uso

Scripts disponíveis no `package.json`:

```bash
npm run dev         # Backend + frontend em modo desenvolvimento
npm run build       # Build do frontend e bundle do servidor
npm run start       # Executa o bundle de produção
npm run lint        # Verifica os tipos com TypeScript
npm run docker:up   # Sobe todos os contêineres com build
npm run backup      # Gera um backup manual do banco
npm run restore     # Restaura o backup mais recente
```

Exemplo de chamada à API (após login):

```bash
curl http://localhost:3030/api/produtos
```

## Variáveis de Ambiente

| Variável            | Descrição                                                | Obrigatória |
|---------------------|----------------------------------------------------------|-------------|
| `DATABASE_URL`      | String de conexão com o Postgres                         | Sim         |
| `POSTGRES_USER`     | Usuário do Postgres (usado pelo `docker-compose`)        | Sim         |
| `POSTGRES_PASSWORD` | Senha do Postgres (usado pelo `docker-compose`)          | Sim         |
| `POSTGRES_DB`       | Nome do banco de dados                                   | Sim         |
| `GEMINI_API_KEY`    | Chave da API do Google Gemini (habilita recursos de IA)  | Não         |
| `APP_URL`           | URL pública da aplicação                                 | Não         |

Veja [`.env.example`](.env.example) como referência.

## Estrutura do Projeto

```
florir_pdv/
├── backups/             # Dumps SQL gerados (manuais e automáticos)
├── db/
│   └── init.sql         # Schema inicial do banco
├── scripts/
│   ├── backup.sh        # Backup manual
│   └── restore.sh       # Restauração
├── server/              # Backend Express (controllers, services, repositories...)
├── src/                 # Frontend React (components, utils, types)
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um *fork* do repositório.
2. Crie uma branch para sua feature: `git checkout -b feature/minha-feature`.
3. Faça *commit* das suas alterações com uma mensagem clara.
4. Abra um *Pull Request*.

Antes de abrir o PR, execute `npm run lint` para garantir que não há erros de tipagem.

## Licença

Distribuído sob a licença MIT.
