import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'
import { OcrProcessor } from './ocr.processor'
import { StorageModule } from '../storage/storage.module'
import { StationsModule } from '../stations/stations.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ocr' }),
    StorageModule,
    StationsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, OcrProcessor],
  exports: [ReviewsService],
})
export class ReviewsModule {}
