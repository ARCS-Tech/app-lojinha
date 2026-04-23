export async function sendAdminNotification(
  order: {
    id: string
    totalAmount: unknown
    items: Array<{ productNameSnapshot: string; quantity: number; lineTotal: unknown }>
    city: { name: string }
    user: { firstName: string; username?: string | null; telegramId: bigint }
  },
  adminTelegramId: string,
  botToken: string
): Promise<void> {
  const itemsList = order.items
    .map((i) => `• ${i.productNameSnapshot} × ${i.quantity} — R$ ${Number(i.lineTotal).toFixed(2)}`)
    .join('\n')

  const username = order.user.username ? ` @${order.user.username}` : ''
  const text = [
    `🛒 Novo pedido #${order.id.slice(-6).toUpperCase()}`,
    '',
    `👤 Cliente: ${order.user.firstName}${username}`,
    `🏙️ Cidade: ${order.city.name}`,
    '',
    `📦 Itens:`,
    itemsList,
    '',
    `💰 Total: R$ ${Number(order.totalAmount).toFixed(2)}`,
    '',
    `💬 Falar com cliente: tg://user?id=${order.user.telegramId}`,
  ].join('\n')

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminTelegramId, text }),
  })
  if (!res.ok) throw new Error(`Telegram API error: ${res.status}`)
}
