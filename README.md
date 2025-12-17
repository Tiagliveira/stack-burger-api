# 🍔 Stack Burger API - Backend Service

![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

> **API Restful robusta para gestão de pedidos, usuários e pagamentos em tempo real.**

Este backend serve como o núcleo da aplicação **Stack Burger**, orquestrando regras de negócio complexas, comunicação em tempo real via WebSockets e processamento de pagamentos. A arquitetura foi desenhada para ser escalável, segura e agnóstica ao front-end.

[Repositório do Front-End (Interface)](https://github.com/Tiagliveira/stack-burger-interface)

---

##  Diferenciais Técnicos & Arquitetura

### 1. Banco de Dados Híbrido (SQL + NoSQL)
A aplicação utiliza uma abordagem estratégica de persistência:
- **PostgreSQL (via Sequelize):** Para dados estruturados e relacionais que exigem integridade rígida (Usuários, Produtos, Categorias).
- **MongoDB (via Mongoose):** Para dados voláteis e de alta frequência de escrita, como o histórico e status dos **Pedidos**, garantindo performance na leitura/escrita.

### 2. Comunicação Real-Time (Socket.io)
Implementação de WebSockets para criar um canal bidirecional entre Cliente e Cozinha.
- **Evento:** Quando um pedido muda de status no Admin, o cliente recebe a atualização instantaneamente sem *polling*.
- **Otimização:** Redução drástica de requisições HTTP desnecessárias ao servidor.

### 3. Segurança e ACL (Access Control List)
- **JWT (JSON Web Token):** Autenticação stateless segura.
- **RBAC (Role-Based Access Control):** Middlewares personalizados (`isAdmin`) que blindam rotas sensíveis. Apenas usuários com privilégio de administrador podem criar produtos ou ver métricas.
- **Bcrypt:** Hashing de senhas antes da persistência.

### 4. Pagamentos (Fintech)
- Integração com **Stripe API**.
- Criação de **Webhooks** para escutar eventos de pagamento e atualizar o status do pedido no banco de dados automaticamente após a confirmação bancária.

---

## Tecnologias Utilizadas

- **Core:** Node.js & Express
- **ORM/ODM:** Sequelize & Mongoose
- **Validação:** Yup (Schema Validation para entradas da API)
- **Infraestrutura:** Docker & Docker Compose
- **Utilitários:** Multer (Uploads), Cors, Dotenv

---

## Como Rodar Localmente

### Pré-requisitos
- Docker e Docker Compose instalados (Recomendado)
- Node.js v18+

### Passo a Passo

1. **Clone o repositório**
```bash
git clone [https://github.com/Tiagliveira/stack-burger-api](https://github.com/Tiagliveira/stack-burger-api)
cd stack-burger-api

### Instale as dependências
npm install
# ou
pnpm install

Inicie o Servidor
pnpm dev
# O servidor rodará na porta 3001 (padrão)
```

## Deploy & Infraestrutura
A API está operando em produção em uma VPS Linux, gerenciada via Easypanel.

O processo de deploy utiliza Dockerfiles otimizados para Node.js.

Nginx atua como Proxy Reverso gerenciando o tráfego e SSL.

## Autor
Desenvolvido por Tiago Oliveira.
