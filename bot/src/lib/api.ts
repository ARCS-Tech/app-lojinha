import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:3000',
  timeout: 5000,
})

export interface City {
  id: string
  name: string
  slug: string
}

export async function getCities(): Promise<City[]> {
  return (await api.get<City[]>('/cities')).data
}
