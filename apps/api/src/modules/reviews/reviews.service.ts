import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { eq, or, sql, desc } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { DB_TOKEN } from '../../db/db.module'
import { reviews, reviewVotes } from '../../db/schema'
import type * as schema from '../../db/schema'
import type { CreateReviewDto } from './dto/create-review.dto'
import type { VoteReviewDto } from './dto/vote-review.dto'
import { StationsGateway } from '../stations/stations.gateway'

type Db = PostgresJsDatabase<typeof schema>

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name)

  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    @InjectQueue('ocr') private readonly ocrQueue: Queue,
    private readonly stationsGateway: StationsGateway,
  ) {}

  async create(dto: CreateReviewDto, phoneHash: string) {
    const [review] = await this.db
      .insert(reviews)
      .values({
        stationId: dto.stationId,
        deviceHash: dto.deviceHash,
        phoneHash,
        stars: dto.stars as unknown as number,
        comment: dto.comment,
        fuelType: dto.fuelType,
        receiptPath: dto.receiptUploadId ?? null,
        status: 'pending',
      })
      .returning()

    if (dto.receiptUploadId && review) {
      await this.ocrQueue.add('verify-receipt', {
        reviewId: review.id,
        receiptPath: dto.receiptUploadId,
        stationId: dto.stationId,
      })
      this.logger.log(`OCR job queued for review ${review.id}`)
    }

    return review
  }

  async vote(reviewId: string, dto: VoteReviewDto) {
    const [existing] = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (!existing) {
      throw new NotFoundException(`Review ${reviewId} no encontrada`)
    }

    // Upsert the vote
    await this.db
      .insert(reviewVotes)
      .values({
        reviewId,
        deviceHash: dto.deviceHash,
        vote: dto.vote,
      })
      .onConflictDoUpdate({
        target: [reviewVotes.reviewId, reviewVotes.deviceHash],
        set: { vote: dto.vote },
      })

    // Recalculate counts
    const helpfulCount = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM review_votes
      WHERE review_id = ${reviewId} AND vote = 'helpful'
    `)

    const spamCount = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM review_votes
      WHERE review_id = ${reviewId} AND vote = 'spam'
    `)

    const helpful = Number((helpfulCount[0] as { count: string })?.count ?? 0)
    const spam = Number((spamCount[0] as { count: string })?.count ?? 0)

    const [updated] = await this.db
      .update(reviews)
      .set({ helpfulCount: helpful, spamCount: spam })
      .where(eq(reviews.id, reviewId))
      .returning()

    return updated
  }

  async report(reviewId: string, deviceHash: string) {
    const [existing] = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (!existing) {
      throw new NotFoundException(`Review ${reviewId} no encontrada`)
    }

    // Register spam vote
    await this.db
      .insert(reviewVotes)
      .values({ reviewId, deviceHash, vote: 'spam' })
      .onConflictDoUpdate({
        target: [reviewVotes.reviewId, reviewVotes.deviceHash],
        set: { vote: 'spam' },
      })

    const newSpamCount = (existing.spamCount ?? 0) + 1
    const newStatus = newSpamCount >= 5 ? 'flagged' : existing.status ?? 'pending'

    const [updated] = await this.db
      .update(reviews)
      .set({ spamCount: newSpamCount, status: newStatus })
      .where(eq(reviews.id, reviewId))
      .returning()

    return { reported: true, status: updated?.status }
  }

  async findMine(deviceHash: string, phoneHash?: string) {
    const conditions = phoneHash
      ? or(eq(reviews.deviceHash, deviceHash), eq(reviews.phoneHash, phoneHash))
      : eq(reviews.deviceHash, deviceHash)

    return this.db
      .select()
      .from(reviews)
      .where(conditions)
      .orderBy(desc(reviews.createdAt))
      .limit(50)
  }

  async updateAfterOcr(
    reviewId: string,
    data: {
      receiptVerified: boolean
      ocrExtracted: Record<string, unknown>
      ocrConfidence: string
    },
  ) {
    const newStatus = data.receiptVerified ? 'approved' : 'pending'

    const [updated] = await this.db
      .update(reviews)
      .set({
        receiptVerified: data.receiptVerified,
        ocrExtracted: data.ocrExtracted,
        ocrConfidence: data.ocrConfidence,
        status: newStatus,
      })
      .where(eq(reviews.id, reviewId))
      .returning()

    if (updated && newStatus === 'approved') {
      // Emit WebSocket event with updated station rating
      const stationStats = await this.db.execute(sql`
        SELECT avg_rating::float, review_count FROM gas_stations WHERE id = ${updated.stationId}
      `)
      const stats = stationStats[0] as { avg_rating: number; review_count: number } | undefined
      if (stats) {
        this.stationsGateway.emitRatingUpdate(
          updated.stationId,
          stats.avg_rating,
          stats.review_count,
        )
      }
    }

    return updated
  }
}
