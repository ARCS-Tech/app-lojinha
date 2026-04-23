import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAdminSettings, useUpdateSettings } from '@/hooks/useAdminSettings'
import type { StoreSetting } from '@/hooks/useAdminSettings'

type FormData = Omit<StoreSetting, 'id'>

export default function StoreSettings() {
  const { data: settings } = useAdminSettings()
  const update = useUpdateSettings()
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>()

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
        <div>
          <label className="block text-sm font-medium mb-1">Cor primária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={watch('primaryColor') || '#7c3aed'}
              onChange={(e) => setValue('primaryColor', e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              {...register('primaryColor')}
              placeholder="#7c3aed"
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Cor dos botões, destaques e preços no Mini App</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cor secundária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={watch('secondaryColor') || '#a78bfa'}
              onChange={(e) => setValue('secondaryColor', e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              {...register('secondaryColor')}
              placeholder="#a78bfa"
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Cor de texto de destaque e preços</p>
        </div>
        <button type="submit" disabled={update.isPending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {update.isPending ? 'Salvando...' : 'Salvar configurações'}
        </button>
        {saved && <p className="text-green-600 text-sm text-center">Salvo com sucesso!</p>}
      </form>
    </div>
  )
}
