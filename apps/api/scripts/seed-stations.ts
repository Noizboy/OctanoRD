/**
 * Seed script: importa gasolineras de Republica Dominicana desde OpenStreetMap
 * Uso: npx ts-node scripts/seed-stations.ts
 */
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

interface OsmNode {
  id: number
  lat: number
  lon: number
  tags?: {
    name?: string
    brand?: string
    'brand:wikidata'?: string
    amenity?: string
    opening_hours?: string
    phone?: string
    'addr:city'?: string
    'addr:state'?: string
    'addr:street'?: string
  }
}

interface OverpassResponse {
  elements: OsmNode[]
}

const BRAND_MAP: Record<string, string> = {
  'Shell': 'Shell',
  'Texaco': 'Texaco',
  'Puma Energy': 'Puma',
  'Puma': 'Puma',
  'Isla': 'Isla',
  'Sunix': 'Sunix',
  'Esso': 'Esso',
  'Total': 'Total',
  'Uno': 'Uno',
  'Miogaz': 'Miogaz',
}

function normalizeBrand(raw?: string): string {
  if (!raw) return 'Sin Marca'
  for (const [key, val] of Object.entries(BRAND_MAP)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return val
  }
  return raw
}

async function fetchOsmStations(): Promise<OsmNode[]> {
  const query = `
    [out:json][timeout:60];
    area["ISO3166-1"="DO"]->.dr;
    node["amenity"="fuel"](area.dr);
    out body;
  `
  console.log('Fetching gas stations from OpenStreetMap...')
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`)
  }

  const data = await response.json() as OverpassResponse
  console.log(`Found ${data.elements.length} stations in OSM`)
  return data.elements
}

async function main() {
  const db = postgres(process.env.DATABASE_URL!, { max: 5 })

  try {
    const nodes = await fetchOsmStations()

    let inserted = 0
    let skipped = 0

    for (const node of nodes) {
      const name = node.tags?.name ?? `Gasolinera ${node.id}`
      const brand = normalizeBrand(node.tags?.brand)
      const lat = node.lat.toString()
      const lng = node.lon.toString()
      const osmId = node.id.toString()
      const municipality = node.tags?.['addr:city'] ?? null
      const province = node.tags?.['addr:state'] ?? null
      const phone = node.tags?.phone ?? null
      const address = node.tags?.['addr:street'] ?? null

      try {
        await db`
          INSERT INTO gas_stations (
            name, brand, lat, lng, osm_id,
            municipality, province, phone, address,
            fuel_types, verified
          ) VALUES (
            ${name}, ${brand}, ${lat}, ${lng}, ${osmId},
            ${municipality}, ${province}, ${phone}, ${address},
            ARRAY['regular', 'premium', 'gasoil_regular', 'gasoil_optimo'],
            false
          )
          ON CONFLICT (osm_id) DO NOTHING
        `
        inserted++
      } catch (err) {
        console.warn(`Skip station ${osmId}: ${(err as Error).message}`)
        skipped++
      }
    }

    console.log(`\nSeed complete: ${inserted} inserted, ${skipped} skipped`)
  } finally {
    await db.end()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
