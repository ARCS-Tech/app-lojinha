import { createHmac } from 'crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export function validateInitData(initData: string, botToken: string): TelegramUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new Error('Missing hash')

  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (expectedHash !== hash) throw new Error('Invalid hash')

  const authDate = Number(params.get('auth_date'))
  if (Math.floor(Date.now() / 1000) - authDate > 300) throw new Error('initData expired')

  return {
    id: Number(params.get('id')),
    first_name: params.get('first_name') ?? '',
    last_name: params.get('last_name') ?? undefined,
    username: params.get('username') ?? undefined,
    language_code: params.get('language_code') ?? undefined,
  }
}
