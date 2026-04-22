import { createHmac, timingSafeEqual } from 'crypto'

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

  const expectedBuf = Buffer.from(expectedHash, 'hex')
  const receivedBuf = Buffer.from(hash, 'hex')
  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    throw new Error('Invalid hash')
  }

  const authDate = Number(params.get('auth_date'))
  if (Math.floor(Date.now() / 1000) - authDate > 300) throw new Error('initData expired')

  const rawUser = params.get('user')
  if (!rawUser) throw new Error('Missing user field')
  const parsed = JSON.parse(rawUser) as {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
  }

  return {
    id: parsed.id,
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    username: parsed.username,
    language_code: parsed.language_code,
  }
}
