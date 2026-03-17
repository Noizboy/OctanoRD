import {
  pgTable,
  uuid,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  jsonb,
  smallint,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'

export const gasStations = pgTable(
  'gas_stations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    brand: text('brand'),
    lat: decimal('lat', { precision: 10, scale: 8 }).notNull(),
    lng: decimal('lng', { precision: 11, scale: 8 }).notNull(),
    address: text('address'),
    municipality: text('municipality'),
    province: text('province'),
    phone: text('phone'),
    hours: jsonb('hours'),
    services: text('services').array(),
    fuelTypes: text('fuel_types').array(),
    avgRating: decimal('avg_rating', { precision: 2, scale: 1 }).default('0'),
    reviewCount: integer('review_count').default(0),
    verified: boolean('verified').default(false),
    claimed: boolean('claimed').default(false),
    osmId: text('osm_id').unique(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    provinceIdx: index('idx_stations_province').on(t.province),
    brandIdx: index('idx_stations_brand').on(t.brand),
  }),
)

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stationId: uuid('station_id')
      .notNull()
      .references(() => gasStations.id, { onDelete: 'cascade' }),
    deviceHash: text('device_fingerprint_hash').notNull(),
    phoneHash: text('phone_hash').notNull(),
    stars: smallint('stars').notNull(),
    comment: text('comment'),
    fuelType: text('fuel_type').notNull(),
    receiptPath: text('receipt_storage_path'),
    receiptVerified: boolean('receipt_verified').default(false),
    ocrExtracted: jsonb('ocr_extracted'),
    ocrConfidence: decimal('ocr_confidence', { precision: 3, scale: 2 }),
    status: text('status').default('pending'),
    helpfulCount: integer('helpful_count').default(0),
    spamCount: integer('spam_count').default(0),
    moderationNote: text('moderation_note'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    stationIdx: index('idx_reviews_station').on(t.stationId),
    statusIdx: index('idx_reviews_status').on(t.status),
    phoneHashIdx: index('idx_reviews_phone_hash').on(t.phoneHash),
    deviceIdx: index('idx_reviews_device_hash').on(t.deviceHash),
  }),
)

export const reviewVotes = pgTable(
  'review_votes',
  {
    reviewId: uuid('review_id')
      .notNull()
      .references(() => reviews.id, { onDelete: 'cascade' }),
    deviceHash: text('device_hash').notNull(),
    vote: text('vote').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.reviewId, t.deviceHash] }),
  }),
)

export const fraudSignals = pgTable('fraud_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  signalType: text('signal_type').notNull(),
  payloadHash: text('payload_hash'),
  stationId: uuid('station_id').references(() => gasStations.id),
  actionTaken: text('action_taken'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const stationClaims = pgTable('station_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .notNull()
    .references(() => gasStations.id),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  rnc: text('rnc'),
  status: text('status').default('pending'),
  submittedAt: timestamp('submitted_at').defaultNow(),
})

// Tipos inferidos
export type GasStation = typeof gasStations.$inferSelect
export type NewGasStation = typeof gasStations.$inferInsert
export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
export type ReviewVote = typeof reviewVotes.$inferSelect
export type FraudSignal = typeof fraudSignals.$inferSelect
export type StationClaim = typeof stationClaims.$inferSelect
