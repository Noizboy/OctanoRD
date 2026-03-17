import { Processor, Process } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import axios from 'axios'
import { ConfigService } from '@nestjs/config'
import { StorageService } from '../storage/storage.service'
import { ReviewsService } from './reviews.service'

interface OcrJobData {
  reviewId: string
  receiptPath: string
  stationId: string
}

interface VisionAnnotation {
  description?: string
  confidence?: number
}

interface VisionResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string
      pages?: Array<{ confidence: number }>
    }
    textAnnotations?: VisionAnnotation[]
  }>
}

interface OcrExtracted {
  rawText: string
  date: string | null
  amount: string | null
  liters: string | null
}

@Processor('ocr')
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name)

  constructor(
    private readonly config: ConfigService,
    private readonly storageService: StorageService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Process('verify-receipt')
  async handleVerifyReceipt(job: Job<OcrJobData>) {
    const { reviewId, receiptPath } = job.data
    this.logger.log(`Processing OCR for review ${reviewId}`)

    try {
      // Download from MinIO
      const imageBuffer = await this.storageService.download(receiptPath)
      const base64Image = imageBuffer.toString('base64')

      // Determine mime type from extension
      const ext = receiptPath.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

      const apiKey = this.config.get<string>('google.visionApiKey')
      let rawText = ''
      let confidence = 0

      if (apiKey) {
        // Call Google Vision API
        const response = await axios.post<VisionResponse>(
          `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
          {
            requests: [
              {
                image: { content: base64Image },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
                imageContext: { languageHints: ['es'] },
              },
            ],
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          },
        )

        const annotation = response.data.responses[0]
        rawText = annotation?.fullTextAnnotation?.text ?? ''
        confidence = annotation?.fullTextAnnotation?.pages?.[0]?.confidence ?? 0
      } else {
        this.logger.warn('Google Vision API key not configured, skipping OCR')
        rawText = ''
        confidence = 0
      }

      // Parse extracted text for Dominican receipt fields
      const extracted = this.parseReceiptText(rawText)
      const receiptVerified = rawText.length > 50 && confidence > 0.7

      await this.reviewsService.updateAfterOcr(reviewId, {
        receiptVerified,
        ocrExtracted: { ...extracted, rawText: rawText.slice(0, 1000) },
        ocrConfidence: confidence.toFixed(2),
      })

      this.logger.log(
        `OCR complete for review ${reviewId}: verified=${receiptVerified}, confidence=${confidence}`,
      )
    } catch (err) {
      this.logger.error(`OCR failed for review ${reviewId}: ${(err as Error).message}`)
      // Don't throw - let the review remain in pending state
    }
  }

  private parseReceiptText(text: string): OcrExtracted {
    if (!text) {
      return { rawText: '', date: null, amount: null, liters: null }
    }

    // Date: DD/MM/YYYY or DD-MM-YYYY
    const dateMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/)
    const date = dateMatch?.[1] ?? null

    // Amount: RD$ or $ followed by numbers
    const amountMatch = text.match(/(?:RD\$|DOP|\$)\s*([\d,]+\.?\d{0,2})/i)
    const amount = amountMatch?.[1] ?? null

    // Liters: number followed by L or litros
    const litersMatch = text.match(/([\d.]+)\s*(?:L|litros?|gal(?:ones?)?)/i)
    const liters = litersMatch?.[1] ?? null

    return { rawText: text.slice(0, 500), date, amount, liters }
  }
}
