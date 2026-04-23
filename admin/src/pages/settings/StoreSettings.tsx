import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAdminSettings, useUpdateSettings } from '@/hooks/useAdminSettings'
import type { StoreSetting } from '@/hooks/useAdminSettings'

type FormData = Omit<StoreSetting, 'id'>

export default function StoreSettings() {
  const { data: settings } = useAdminSettings()
  const update = useUpdateSettings()
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, reset } = useForm<FormData>()

  useEffect(() => { if (settings) reset(settings) }, [settings, reset])

  function onSubmit(data: FormData) {
    update.mutate(data, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
    })
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Configurações da loja</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-2xl p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Nome da loja</label><input {...register('storeName')} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">URL do logo</label><input {...register('logoUrl')} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Link do suporte Telegram</label><input {...register('supportTelegramUrl')} placeholder="https://t.me/suporte" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div>
          <label className="block text-sm font-medium mb-1">Telegram ID do admin</label>
          <input {...register('adminTelegramId')} placeholder="Ex: 123456789" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">ID numérico do Telegram que receberá notificações de novos pedidos</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Idioma padrão</label>
          <select {...register('defaultLanguage')} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="pt">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-1">Texto de boas-vindas (bot)</label><textarea {...register('welcomeText')} rows={3} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
        <button type="submit" disabled={update.isPending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {update.isPending ? 'Salvando...' : 'Salvar configurações'}
        </button>
        {saved && <p className="text-green-600 text-sm text-center">Salvo com sucesso!</p>}
      </form>
    </div>
  )
}
