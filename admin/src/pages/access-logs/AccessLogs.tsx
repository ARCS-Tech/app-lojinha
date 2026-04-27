import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useAdminAccessLogs, type AdminAccessLog } from '@/hooks/useAdminAccessLogs'
import { ALPHA2_TO_NUMERIC, resolveGeo, type GeoResult } from '@/lib/countryCodeMap'

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
  const [selected, setSelected] = useState<{ log: AdminAccessLog; geo: GeoResult } | null>(null)

  const { data, isLoading } = useAdminAccessLogs({ page, limit: 25, ...activeFilters })

  const geoCache = useRef<Map<string, GeoResult>>(new Map())
  const [geoMap, setGeoMap] = useState<Map<string, GeoResult>>(new Map())

  useEffect(() => {
    if (!data) return
    const unresolvedIps = [...new Set(data.data.map((l) => l.ip))].filter(
      (ip) => !geoCache.current.has(ip)
    )
    unresolvedIps.forEach((ip) => {
      resolveGeo(ip)
        .then((result) => {
          geoCache.current.set(ip, result)
          setGeoMap(new Map(geoCache.current))
        })
        .catch(() => {
          geoCache.current.set(ip, { success: false })
          setGeoMap(new Map(geoCache.current))
        })
    })
  }, [data])

  const countByNumericId = new Map<number, number>()
  geoMap.forEach((geo) => {
    const numId = geo.country_code ? ALPHA2_TO_NUMERIC[geo.country_code] : undefined
    if (numId) countByNumericId.set(numId, (countByNumericId.get(numId) ?? 0) + 1)
  })

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

  function handleRowClick(log: AdminAccessLog) {
    const geo = geoMap.get(log.ip)
    if (geo) setSelected({ log, geo })
  }

  const logs = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const uniqueIps = new Set(logs.map((l) => l.ip)).size
  const uniqueCountries = new Set([...geoMap.values()].map((g) => g.country_code).filter(Boolean)).size
  const today = new Date().toDateString()
  const todayCount = logs.filter((l) => new Date(l.createdAt).toDateString() === today).length

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
                  geo={geoMap.get(log.ip)}
                  onClick={() => handleRowClick(log)}
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

function LogRow({
  log,
  geo,
  onClick,
}: {
  log: AdminAccessLog
  geo: GeoResult | undefined
  onClick: () => void
}) {
  const resolved = geo?.success !== undefined
  const locationText = !resolved
    ? null
    : !geo?.success
    ? '—'
    : `${geo.country_code} · ${geo.city || geo.country}`

  return (
    <tr
      onClick={resolved ? onClick : undefined}
      className={`${resolved ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
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
  geo: GeoResult
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
          <div className="flex items-center gap-3">
            {geo.flag?.emoji && (
              <span className="text-3xl leading-none">{geo.flag.emoji}</span>
            )}
            <div>
              <p className="font-semibold text-gray-800 font-mono">{log.ip}</p>
              <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {!geo.success ? (
            <p className="text-sm text-gray-400 text-center py-4">Geolocalização indisponível para este IP.</p>
          ) : (
            <>
              {/* Localização */}
              <Section title="Localização">
                <Row label="País" value={geo.country && geo.country_code ? `${geo.country} (${geo.country_code})` : geo.country} />
                <Row label="Continente" value={geo.continent} />
                <Row label="Região" value={geo.region && geo.region_code ? `${geo.region} (${geo.region_code})` : geo.region} />
                <Row label="Cidade" value={geo.city} />
                <Row label="CEP" value={geo.postal} />
                <Row label="Coordenadas" value={geo.latitude != null && geo.longitude != null ? `${geo.latitude}, ${geo.longitude}` : undefined} />
                <Row label="Capital" value={geo.capital} />
                <Row label="União Europeia" value={geo.is_eu != null ? (geo.is_eu ? 'Sim' : 'Não') : undefined} />
              </Section>

              {/* Rede */}
              {geo.connection && (
                <Section title="Rede / ISP">
                  <Row label="ISP" value={geo.connection.isp} />
                  <Row label="Organização" value={geo.connection.org} />
                  <Row label="ASN" value={geo.connection.asn ? `AS${geo.connection.asn}` : undefined} />
                  <Row label="Domínio" value={geo.connection.domain} />
                </Section>
              )}

              {/* Fuso horário */}
              {geo.timezone && (
                <Section title="Fuso Horário">
                  <Row label="Timezone" value={geo.timezone.id} />
                  <Row label="Abreviação" value={geo.timezone.abbr} />
                  <Row label="UTC" value={geo.timezone.utc} />
                  <Row label="Horário de verão" value={geo.timezone.is_dst ? 'Sim' : 'Não'} />
                </Section>
              )}

              {/* Acesso */}
              <Section title="Acesso">
                <Row label="Tipo de IP" value={geo.type} />
                <Row label="DDI" value={geo.calling_code ? `+${geo.calling_code}` : undefined} />
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
