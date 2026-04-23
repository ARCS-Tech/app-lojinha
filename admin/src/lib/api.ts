import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const api = axios.create({ baseURL: BASE_URL })

export function setAdminToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
export function clearAdminToken() {
  delete api.defaults.headers.common['Authorization']
}
