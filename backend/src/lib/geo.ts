import { PrismaClient } from '@prisma/client'

const IP_API_FIELDS = 'status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting'

export async function resolveAndCacheGeo(ip: string, prisma: PrismaClient): Promise<void> {
  const existing = await prisma.geoCache.findUnique({ where: { ip } })
  if (existing) return

  const res = await fetch(`http://ip-api.com/json/${ip}?fields=${IP_API_FIELDS}`)
  const data = await res.json() as Record<string, unknown>

  await prisma.geoCache.upsert({
    where: { ip },
    create: {
      ip,
      status: typeof data.status === 'string' ? data.status : 'fail',
      country: typeof data.country === 'string' ? data.country : null,
      countryCode: typeof data.countryCode === 'string' ? data.countryCode : null,
      continent: typeof data.continent === 'string' ? data.continent : null,
      continentCode: typeof data.continentCode === 'string' ? data.continentCode : null,
      region: typeof data.region === 'string' ? data.region : null,
      regionName: typeof data.regionName === 'string' ? data.regionName : null,
      city: typeof data.city === 'string' ? data.city : null,
      zip: typeof data.zip === 'string' ? data.zip : null,
      lat: typeof data.lat === 'number' ? data.lat : null,
      lon: typeof data.lon === 'number' ? data.lon : null,
      timezone: typeof data.timezone === 'string' ? data.timezone : null,
      isp: typeof data.isp === 'string' ? data.isp : null,
      org: typeof data.org === 'string' ? data.org : null,
      asInfo: typeof data.as === 'string' ? data.as : null,
      mobile: typeof data.mobile === 'boolean' ? data.mobile : null,
      proxy: typeof data.proxy === 'boolean' ? data.proxy : null,
      hosting: typeof data.hosting === 'boolean' ? data.hosting : null,
    },
    update: {},
  })
}
