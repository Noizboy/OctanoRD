import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { sql, ilike, and, gte, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { DB_TOKEN } from '../../db/db.module'
import { gasStations } from '../../db/schema'
import type * as schema from '../../db/schema'
import type { NearbyStationsDto } from './dto/nearby-stations.dto'
import type { SearchStationsDto } from './dto/search-stations.dto'

type Db = PostgresJsDatabase<typeof schema>

@Injectable()
export class StationsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async findNearby(dto: NearbyStationsDto) {
    const { lat, lng, radius = 10, minRating, brand } = dto
    const radiusMeters = radius * 1000

    // ST_DWithin with geography type for accurate distance in meters
    const results = await this.db.execute(sql`
      SELECT
        gs.*,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          geom::geography
        ) AS distance_meters
      FROM gas_stations gs
      WHERE
        geom IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          geom::geography,
          ${radiusMeters}
        )
        ${minRating != null ? sql`AND gs.avg_rating::numeric >= ${minRating}` : sql``}
        ${brand ? sql`AND gs.brand ILIKE ${`%${brand}%`}` : sql``}
      ORDER BY distance_meters ASC
      LIMIT 50
    `)

    return results
  }

  async findAll() {
    const results = await this.db.execute(sql`
      SELECT
        id, name, brand, lat, lng, address, municipality, province,
        phone, hours, services, fuel_types, avg_rating, review_count,
        verified, claimed, osm_id, created_at, updated_at
      FROM gas_stations
      WHERE geom IS NOT NULL
      ORDER BY name ASC
    `)
    return results
  }

  async findOne(id: string) {
    const [station] = await this.db
      .select()
      .from(gasStations)
      .where(eq(gasStations.id, id))
      .limit(1)

    if (!station) {
      throw new NotFoundException(`Gasolinera ${id} no encontrada`)
    }

    return station
  }

  async search(dto: SearchStationsDto) {
    const { q, province, brand, limit = 20, offset = 0 } = dto

    const conditions = []

    if (q) {
      conditions.push(ilike(gasStations.name, `%${q}%`))
    }

    if (province) {
      conditions.push(ilike(gasStations.province, `%${province}%`))
    }

    if (brand) {
      conditions.push(ilike(gasStations.brand, `%${brand}%`))
    }

    const baseQuery = this.db.select().from(gasStations)

    const results = await (conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery
    ).limit(limit).offset(offset)

    return results
  }

  async getReviews(stationId: string, limit = 10, offset = 0) {
    // Verify station exists
    await this.findOne(stationId)

    const results = await this.db.execute(sql`
      SELECT *
      FROM reviews
      WHERE station_id = ${stationId}
        AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return results
  }
}
