/**
 * Seed script: importa ratings de Google Places API para las gasolineras existentes
 * Uso: GOOGLE_MAPS_API_KEY=AIza... npx ts-node scripts/seed-google-ratings.ts
 */
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

if (!GOOGLE_API_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY env var')
  process.exit(1)
}

interface PlaceResult {
  place_id: string
  name: string
  rating?: number
  user_ratings_total?: number
  geometry: {
    location: { lat: number; lng: number }
  }
}

interface NearbySearchResponse {
  results: PlaceResult[]
  status: string
}

interface Station {
  id: string
  name: string
  lat: string
  lng: string
  brand: string | null
}

async function findGoogleRating(lat: string, lng: string, stationName: string): Promise<{ rating: number; reviewCount: number } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', '150') // 150m radius to find the exact station
  url.searchParams.set('type', 'gas_station')
  url.searchParams.set('key', GOOGLE_API_KEY!)

  const response = await fetch(url.toString())
  if (!response.ok) {
    console.warn(`  Google API error: ${response.status}`)
    return null
  }

  const data = (await response.json()) as NearbySearchResponse

  if (data.status !== 'OK' || data.results.length === 0) {
    return null
  }

  // Pick the closest result that has a rating
  const withRating = data.results.filter((r) => r.rating != null && r.user_ratings_total != null)
  if (withRating.length === 0) return null

  // Prefer name match, otherwise take the closest (first result)
  const nameLower = stationName.toLowerCase()
  const nameMatch = withRating.find(
    (r) =>
      r.name.toLowerCase().includes(nameLower) ||
      nameLower.includes(r.name.toLowerCase()),
  )

  const best = nameMatch ?? withRating[0]

  return {
    rating: best.rating!,
    reviewCount: best.user_ratings_total!,
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const db = postgres(process.env.DATABASE_URL!, { max: 5 })

  try {
    const stations = await db<Station[]>`
      SELECT id, name, lat, lng, brand
      FROM gas_stations
      ORDER BY review_count ASC, name ASC
    `

    console.log(`Found ${stations.length} stations to update`)

    let updated = 0
    let skipped = 0
    let notFound = 0

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i]
      const progress = `[${i + 1}/${stations.length}]`

      try {
        const result = await findGoogleRating(station.lat, station.lng, station.name)

        if (result) {
          await db`
            UPDATE gas_stations
            SET avg_rating = ${result.rating.toFixed(1)},
                review_count = ${result.reviewCount},
                updated_at = NOW()
            WHERE id = ${station.id}
          `
          console.log(`${progress} ✓ ${station.name} (${station.brand}) → ${result.rating} (${result.reviewCount} reviews)`)
          updated++
        } else {
          console.log(`${progress} - ${station.name} → no Google rating found`)
          notFound++
        }
      } catch (err) {
        console.warn(`${progress} ✗ ${station.name}: ${(err as Error).message}`)
        skipped++
      }

      // Rate limit: Google Places allows 50 QPS, but be conservative
      await sleep(200)
    }

    console.log(`\nDone: ${updated} updated, ${notFound} not found, ${skipped} errors`)
  } finally {
    await db.end()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
