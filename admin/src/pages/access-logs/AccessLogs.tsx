import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useAdminAccessLogs, type AdminAccessLog, type GeoData } from '@/hooks/useAdminAccessLogs'
import { ALPHA2_TO_NUMERIC } from '@/lib/countryCodeMap'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function parseUserAgent(ua: string | null) {
  if (!ua) return '—'
  if (/iPhone|iPad/i.test(ua)) return 'iOS · Telegram'
  if (/Android/i.test(ua)) return 'Android · Telegram'
  if (/Windows/i.test(ua)) return 'Windows · Telegram Web'
  if (/Mac/i.test(ua)) return 'Mac · Telegram Web'
  return ua.slice(0, 40)
}

export default function AccessLogs() {
  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [ipFilter, setIpFilter] = useState('')
  const [activeFilters, setActiveFilters] = useState<{ from?: string; to?: string; ip?: string }>({})
  const [mapZoom, setMapZoom] = useState(1)
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20])
  const [selected, setSelected] = useState<{ log: AdminAccessLog; geo: GeoData } | null>(null)

  const { data, isLoading } = useAdminAccessLogs({ page, limit: 25, ...activeFilters })

  const logs = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const countByNumericId = new Map<number, number>()
  logs.forEach((log) => {
    const code = log.geo?.countryCode
    const numId = code ? ALPHA2_TO_NUMERIC[code] : undefined
    if (numId) countByNumericId.set(numId, (countByNumericId.get(numId) ?? 0) + 1)
  })

  const uniqueIps = new Set(logs.map((l) => l.ip)).size
  const uniqueCountries = new Set(logs.map((l) => l.geo?.countryCode).filter(Boolean)).size
  const today = new Date().toDateString()
  const todayCount = logs.filter((l) => new Date(l.createdAt).toDateString() === today).length

  function getColor(numId: number) {
    const count = countByNumericId.get(numId) ?? 0
    if (count === 0) return '#e2e8f0'
    if (count <= 10) return '#fecaca'
    if (count <= 50) return '#f87171'
    if (count <= 200) return '#dc2626'
    return '#7f1d1d'
  }

  function applyFilters() {
    setPage(1)
    setActiveFilters({
      from: fromDate || undefined,
      to: toDate || undefined,
      ip: ipFilter || undefined,
    })
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📡 Logs de Acesso</h1>
        <span className="text-sm text-gray-400">Últimos 30 dias</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de acessos', value: total },
          { label: 'IPs únicos', value: uniqueIps },
          { label: 'Países', value: uniqueCountries },
          { label: 'Hoje', value: todayCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Distribuição geográfica
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMapZoom((z) => Math.min(8, +(z * 1.5).toFixed(2)))}
              className="w-7 h-7 flex items-center justify-center border rounded text-gray-500 hover:bg-gray-50 text-base leading-none"
              title="Zoom in"
            >+</button>
            <button
              onClick={() => { setMapZoom(1); setMapCenter([0, 20]) }}
              className="px-2 h-7 flex items-center justify-center border rounded text-gray-400 hover:bg-gray-50 text-xs"
              title="Reset"
            >Reset</button>
            <button
              onClick={() => setMapZoom((z) => Math.max(1, +(z / 1.5).toFixed(2)))}
              className="w-7 h-7 flex items-center justify-center border rounded text-gray-500 hover:bg-gray-50 text-base leading-none"
              title="Zoom out"
            >−</button>
          </div>
        </div>
        <ComposableMap projectionConfig={{ scale: 140 }} height={280}>
          <ZoomableGroup
            zoom={mapZoom}
            center={mapCenter}
            minZoom={1}
            maxZoom={8}
            onMoveEnd={({ coordinates, zoom }) => { setMapCenter(coordinates); setMapZoom(zoom) }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(Number(geo.id))}
                    stroke="#fff"
                    strokeWidth={0.4}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none', opacity: 0.8 }, pressed: { outline: 'none' } }}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        <div className="flex gap-4 mt-2 flex-wrap">
          {[
            { label: '1–10', color: '#fecaca' },
            { label: '11–50', color: '#f87171' },
            { label: '51–200', color: '#dc2626' },
            { label: '200+', color: '#7f1d1d' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Registros</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Filtrar por IP..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
            />
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="p-6 text-gray-400 text-sm">Carregando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data / Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Localização</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Usuário Telegram</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  onClick={log.geo?.status === 'success' ? () => setSelected({ log, geo: log.geo! }) : undefined}
                />
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
          <span>
            {total > 0
              ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} de ${total} registros`
              : '0 registros'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 border rounded-lg ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <AccessLogDialog
          log={selected.log}
          geo={selected.geo}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function LogRow({ log, onClick }: { log: AdminAccessLog; onClick?: () => void }) {
  const geo = log.geo
  const resolved = geo !== null
  const locationText = !resolved
    ? null
    : geo.status === 'fail'
    ? '—'
    : `${geo.countryCode} · ${geo.city || geo.country}`

  return (
    <tr
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
    >
      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
      <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
      <td className="px-4 py-3">
        {locationText !== null ? (
          <span className="text-xs text-gray-600">{locationText}</span>
        ) : (
          <span className="text-xs text-gray-300 italic">resolvendo...</span>
        )}
      </td>
      <td className="px-4 py-3">
        {log.user ? (
          <span className="text-sm">
            {log.user.firstName}
            {log.user.username ? (
              <span className="text-gray-400 text-xs"> @{log.user.username}</span>
            ) : null}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{parseUserAgent(log.userAgent)}</td>
    </tr>
  )
}

function AccessLogDialog({
  log,
  geo,
  onClose,
}: {
  log: AdminAccessLog
  geo: GeoData
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="font-semibold text-gray-800 font-mono">{log.ip}</p>
            <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {geo.status === 'fail' ? (
            <p className="text-sm text-gray-400 text-center py-4">Geolocalização indisponível para este IP.</p>
          ) : (
            <>
              {/* Localização */}
              <Section title="Localização">
                <Row label="País" value={geo.country && geo.countryCode ? `${geo.country} (${geo.countryCode})` : geo.country ?? undefined} />
                <Row label="Continente" value={geo.continent && geo.continentCode ? `${geo.continent} (${geo.continentCode})` : geo.continent ?? undefined} />
                <Row label="Região" value={geo.regionName && geo.region ? `${geo.regionName} (${geo.region})` : geo.regionName ?? undefined} />
                <Row label="Cidade" value={geo.city ?? undefined} />
                <Row label="CEP" value={geo.zip ?? undefined} />
                <Row label="Coordenadas" value={geo.lat != null && geo.lon != null ? `${geo.lat}, ${geo.lon}` : undefined} />
              </Section>

              {/* Rede */}
              <Section title="Rede / ISP">
                <Row label="ISP" value={geo.isp ?? undefined} />
                <Row label="Organização" value={geo.org ?? undefined} />
                <Row label="AS" value={geo.asInfo ?? undefined} />
                <Row label="Proxy / VPN" value={geo.proxy != null ? (geo.proxy ? 'Sim' : 'Não') : undefined} />
                <Row label="Hosting" value={geo.hosting != null ? (geo.hosting ? 'Sim' : 'Não') : undefined} />
                <Row label="Mobile" value={geo.mobile != null ? (geo.mobile ? 'Sim' : 'Não') : undefined} />
              </Section>

              {/* Fuso horário */}
              {geo.timezone && (
                <Section title="Fuso Horário">
                  <Row label="Timezone" value={geo.timezone} />
                </Section>
              )}

              {/* Acesso */}
              <Section title="Acesso">
                {log.user && (
                  <>
                    <Row label="Usuário" value={log.user.firstName} />
                    {log.user.username && <Row label="Username" value={`@${log.user.username}`} />}
                    <Row label="Telegram ID" value={log.user.telegramId} />
                  </>
                )}
                <Row label="User-Agent" value={log.userAgent ?? undefined} mono />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string | number; mono?: boolean }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs text-gray-800 text-right break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
