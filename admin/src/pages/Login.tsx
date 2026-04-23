import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'
import { api } from '@/lib/api'

export default function Login() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setStoreToken = useAdminStore((s) => s.setToken)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.get('/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      setStoreToken(token)
      navigate('/', { replace: true })
    } catch {
      setError('Token inválido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Admin</h1>
        <p className="text-gray-500 text-sm mb-6">Digite o token de acesso</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Token de admin"
            className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading || !token}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
