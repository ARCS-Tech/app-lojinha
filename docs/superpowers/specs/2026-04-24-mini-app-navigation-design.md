# Mini-App Navigation & Auth Reliability — Design Spec

**Date:** 2026-04-24  
**Scope:** `mini-app/` frontend only  
**Status:** Approved

---

## Problem

1. **Navegação presa:** Usuário na tela de Pedidos não tem como voltar ao menu principal. Não existe ponto de entrada para Pedidos a partir do Catálogo.
2. **Auth não confiável:** `AuthGate` só autentica quando não há token no `localStorage`. Se o JWT expirar, as chamadas de API falham silenciosamente e o histórico de pedidos fica inacessível.

---

## Solution Overview

1. **Bottom Navigation Bar** com 3 abas fixas substituindo o `CartFAB`.
2. **Botão de voltar explícito** na tela de Pedidos.
3. **Re-autenticação sempre no mount** usando o `initData` do Telegram.

---

## Part 1 — Bottom Navigation Bar

### Componente: `BottomNav`

- Arquivo: `mini-app/src/components/BottomNav.tsx`
- Posição: `position: fixed; bottom: 0; left: 0; right: 0`
- 3 abas em ordem: **Catálogo** (`/`) · **Carrinho** (`/cart`) · **Pedidos** (`/orders`)
- Aba ativa: destaque com `var(--color-primary)`, ícone + label coloridos
- Badge no Carrinho: exibe contagem de itens do `useCartStore` quando > 0
- Oculto em: `CitySelect` (`/city`) e durante auth loading (antes de `AuthGate` liberar)
- `SupportFAB` permanece — posicionado `bottom: calc(var(--bottom-nav-height) + 16px)` para não sobrepor a barra

### Remoção do `CartFAB`

- `CartFAB.tsx` removido. A navegação para `/cart` passa a ser exclusivamente pela bottom nav.
- Referências a `CartFAB` removidas de `App.tsx` ou do componente layout raiz.

### Ajuste de layout

- Um wrapper `<div>` com `padding-bottom: var(--bottom-nav-height)` envolve as rotas em `App.tsx`, sem necessidade de alterar cada página individualmente.
- Variável CSS: `--bottom-nav-height: 64px` definida em `index.css`.

---

## Part 2 — Navegação de Volta

### `Orders.tsx`

- Adiciona botão "← Catálogo" no topo da tela (mesmo padrão visual dos outros botões de voltar existentes).
- Usa `navigate('/')` — navegação explícita, não `navigate(-1)`, pois o usuário pode ter chegado de qualquer lugar.

### Páginas existentes (sem alteração)

- `OrderDetail.tsx` — mantém `navigate(-1)` (volta para lista de pedidos).
- `ProductDetail.tsx` — mantém `navigate(-1)`.
- `Cart.tsx` — mantém `navigate(-1)`.
- `OrderConfirm.tsx` — mantém botões atuais.

---

## Part 3 — Auth Reliability com initData

### Problema atual

```ts
// AuthGate.tsx — linha 18 (atual, problemático)
useEffect(() => { if (!token) login() }, [token, login])
```

Se há token cacheado mas expirado, o app nunca re-autentica e todas as chamadas retornam 401.

### Nova lógica

```ts
// AuthGate.tsx — nova lógica
useEffect(() => {
  login() // sempre re-autentica no mount
}, [])    // sem dependências — roda uma vez
```

- O token cacheado no `localStorage` continua sendo usado para requests enquanto a re-auth está em progresso (o `onRehydrateStorage` do Zustand já seta o token no cliente API).
- `onSuccess` de `loginMutation` chama `setAuth(token, user)` — atualiza token e user com os dados frescos.
- Se a re-auth falhar (ex: initData inválido/expirado), o `AuthGate` exibe erro + botão de retry — mesmo comportamento atual.

### Garantia de histórico

O backend usa `telegramId` (extraído do initData assinado pelo Telegram) como identidade permanente do usuário. Sempre que o mini-app é aberto pelo Telegram, `initData` está disponível e contém o `telegramId` correto — garantindo acesso ao histórico mesmo após troca de dispositivo ou limpeza de cache.

---

## Files to Change

| Arquivo | Mudança |
|---------|---------|
| `src/components/BottomNav.tsx` | Criar — novo componente |
| `src/components/CartFAB.tsx` | Remover |
| `src/components/SupportFAB.tsx` | Ajustar posicionamento vertical |
| `src/pages/Orders.tsx` | Adicionar botão "← Catálogo" |
| `src/pages/AuthGate.tsx` | Sempre chamar `login()` no mount |
| `src/App.tsx` | Integrar `BottomNav`, remover `CartFAB` |
| `src/index.css` | Adicionar `--bottom-nav-height: 64px`, padding global |

---

## Out of Scope

- Redesign de outras páginas
- Animações de transição entre abas
- Persistent scroll position por aba
- Notificações de status de pedido
