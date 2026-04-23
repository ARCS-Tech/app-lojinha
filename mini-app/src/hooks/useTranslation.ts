import { useState, useEffect } from 'react'
import pt from '../i18n/pt.json'
import es from '../i18n/es.json'
import en from '../i18n/en.json'

const translations = { pt, es, en } as const
export type Lang = keyof typeof translations
type Keys = keyof typeof pt

const STORAGE_KEY = 'lojinha-lang'
const SUPPORTED: Lang[] = ['pt', 'es', 'en']

function initLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY) as Lang
  if (stored && SUPPORTED.includes(stored)) return stored
  return 'pt'
}

let currentLang: Lang = initLang()
const listeners = new Set<() => void>()

export function setLanguage(lang: Lang) {
  currentLang = lang
  localStorage.setItem(STORAGE_KEY, lang)
  listeners.forEach((fn) => fn())
}

export function t(key: Keys): string {
  return (translations[currentLang] as Record<string, string>)[key]
    ?? (translations.pt as Record<string, string>)[key]
    ?? key
}

export function useTranslation() {
  const [, rerender] = useState(0)

  useEffect(() => {
    const fn = () => rerender((n) => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  return { t, lang: currentLang, setLanguage }
}
