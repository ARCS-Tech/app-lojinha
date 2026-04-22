# Telegram Store — Design Spec

**Data:** 2026-04-22  
**Status:** Aprovado

---

## Visão Geral

Loja no Telegram composta por um bot de entrada, um Mini App (Telegram Web App) como vitrine e carrinho, um backend REST e um painel admin web. Sem gateway de pagamento — ao finalizar o pedido, o admin recebe uma notificação no Telegram com os dados e segue com o atendimento manual.

---

## Arquitetura

4 processos independentes no mesmo monorepo:

```
app-lojinha/
├── backend/    # Fastify + Prisma + PostgreSQL
├── bot/        # grammY — entry point do usuário
├── mini-app/   # React + Vite — Telegram Mini App
└── admin/      # React + Vite — painel administrativo
```

### Fluxo do usuário

1. Usuário encontra o bot no Telegram → envia `/start`
2. Bot responde com botões inline das 4 cidades disponíveis
3. Usuário seleciona cidade → backend salva `selectedCityId` no usuário → bot exibe botão "Abrir Loja"
4. Telegram solicita aceite dos termos (responsabilidade da plataforma, não do app)
5. Mini App abre, autentica via `initData`, carrega catálogo
6. Usuário navega, adiciona produtos ao carrinho, confirma pedido
7. Backend cria o pedido em transação, decrementa estoque, envia notificação ao admin via Telegram API
8. Admin recebe mensagem com dados do pedido + link direto para o cliente

### Fluxo do admin

- Acessa `admin/` no browser com token secreto (`ADMIN_SECRET`)
- Gerencia produtos, categorias, cidades, pedidos e configurações da loja

---

## Banco de Dados

Base: schema dos planos existentes. Modificações:

### Product — campo adicional
```prisma
stock  Int  @default(0)
```
Produtos com `stock = 0` ficam visíveis no catálogo mas não podem ser adicionados ao carrinho (badge "Esgotado").

### StoreSetting — campo adicional
```prisma
adminTelegramId  String?   # Telegram ID numérico do dono — destinatário das notificações de pedidos
```

### Review — removida do escopo
O modelo `Review` pode permanecer no schema mas não terá endpoints nem UI implementados.

### Demais modelos
User, City, Category, ProductMedia, Order, OrderItem — sem alterações em relação ao schema existente.

---

## Backend

**Stack:** Node.js 20, TypeScript, Fastify 4, Prisma 5, PostgreSQL 15, Vitest

### Endpoint modificado: `POST /orders/checkout`

Lógica em transação Prisma única:
1. Carrega todos os produtos solicitados (`isActive = true`)
2. Valida que cada produto tem `stock >= quantidade` — retorna `400` se insuficiente
3. Decrementa `stock` de cada produto
4. Cria `Order` com status `submitted` e `OrderItem`s com snapshots de nome e preço
5. Após commit, dispara notificação ao admin (fora da transação para não bloquear rollback)

**Notificação ao admin (HTTP para `api.telegram.org`):**
```
🛒 Novo pedido #XXXXXX

👤 Cliente: {firstName} {username && @username}
🏙️ Cidade: {cityName}

📦 Itens:
• {productName} × {qty} — R$ {lineTotal}
...

💰 Total: R$ {totalAmount}

💬 Falar com cliente: tg://user?id={telegramId}
```

Enviada para `StoreSetting.adminTelegramId`. Se o campo estiver vazio, notificação é ignorada silenciosamente.

### Endpoint modificado: `GET /products`
Retorna campo `stock` em cada produto.

### Endpoints de Review
Não implementados.

### Endpoints de admin — novos
- `GET /admin/categories` — listagem
- `POST /admin/categories` — criar
- `PATCH /admin/categories/:id` — editar / ativar / desativar
- `DELETE /admin/categories/:id` — remover

---

## Mini App

**Stack:** React 18, Vite 5, TypeScript, Tailwind CSS, Zustand, TanStack Query v5, React Router v6

### Telas

| Rota | Tela | Descrição |
|---|---|---|
| (wrapper) | AuthGate | Autentica via `initData`, mostra spinner enquanto carrega |
| `/city` | CitySelect | Seleção de cidade — só aparece se `user.selectedCityId` for nulo |
| `/` | Catalog | Grid de produtos, filtro por categoria, busca por nome |
| `/products/:id` | ProductDetail | Galeria de mídia, descrição, quantidade, botão adicionar |
| `/cart` | Cart | Revisão do carrinho, total, botão confirmar pedido |
| `/orders/:id/confirm` | OrderConfirm | Tela de sucesso pós-pedido |
| `/orders` | Orders | Histórico de pedidos do usuário com status |
| `/orders/:id` | OrderDetail | Detalhes de um pedido específico |

### Componentes globais

**Header** (fixo no topo em todas as telas pós-autenticação):
- Título da loja (`StoreSetting.storeName`)
- Seletor de idioma: PT / ES / EN

**SupportFAB** (botão flutuante inferior esquerdo):
- Abre `StoreSetting.supportTelegramUrl` via `tg.openTelegramLink()`

**CartFAB** (botão flutuante inferior direito):
- Visível apenas quando carrinho tem itens
- Badge com quantidade total

### Catálogo — regras de negócio
- Produto com `stock = 0`: exibe badge "Esgotado", botão de adicionar desabilitado
- Produto com `stock > 0`: comportamento normal
- Clicar na imagem/vídeo na `ProductDetail` abre a mídia em tela cheia

### i18n

Hook customizado `useTranslation()` sem dependências externas:
- Arquivos: `src/i18n/pt.json`, `src/i18n/es.json`, `src/i18n/en.json`
- Idioma inicial: `StoreSetting.defaultLanguage`
- Troca de idioma salva em `localStorage` e sobrepõe o padrão da loja
- Todas as strings visíveis ao usuário passam pelo hook

### 2 abas de navegação
Catálogo e Meus Pedidos. Aba de Avaliações não implementada.

---

## Painel Admin

**Stack:** React 18, Vite 5, TypeScript, Tailwind CSS, TanStack Query v5, React Hook Form, React Router v6

### Páginas

| Rota | Página |
|---|---|
| `/login` | Login com token secreto |
| `/` | Dashboard — hub de navegação |
| `/products` | Lista de produtos (nome, categoria, preço, estoque, status) |
| `/products/new` | Formulário de criação |
| `/products/:id/edit` | Formulário de edição + gerenciador de mídias |
| `/orders` | Lista de pedidos com filtro por status |
| `/orders/:id` | Detalhes do pedido + controle de status |
| `/cities` | Lista de cidades com ativar/desativar |
| `/cities/new` | Criar cidade |
| `/cities/:id/edit` | Editar cidade |
| `/categories` | Lista de categorias |
| `/categories/new` | Criar categoria |
| `/categories/:id/edit` | Editar categoria |
| `/settings` | Configurações da loja |

### Controle de status de pedidos

Transições permitidas (explícitas, sem pular etapas):

```
submitted → in_review → confirmed
submitted → cancelled
in_review → cancelled
```

`confirmed` e `cancelled` são estados terminais — sem transições possíveis a partir deles.

O admin vê botões para cada transição válida na página de detalhe do pedido.

### Configurações da loja (`/settings`)

Campos editáveis:
- Nome da loja
- URL do logo
- Link do suporte Telegram (SupportFAB)
- Idioma padrão do Mini App
- Texto de boas-vindas do bot
- **Telegram ID do admin** (destinatário das notificações de pedidos)

---

## Fora do Escopo (MVP)

- Gateway de pagamento
- Reviews / avaliações
- Notificação ao cliente sobre mudança de status do pedido
- Múltiplos admins
- Controle de estoque por cidade
