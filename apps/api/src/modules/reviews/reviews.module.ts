import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ConfigModule, ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'
import { OcrProcessor } from './ocr.processor'
import { FraudInterceptor } from '../../common/interceptors/fraud.interceptor'
import { StorageModule } from '../storage/storage.module'
import { StationsModule } from '../stations/stations.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ocr' }),
    StorageModule,
    StationsModule,
    ConfigModule,
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    OcrProcessor,
    FraudInterceptor,
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('redis.url') ?? 'redis://localhost:6379'
        return new Redis(url)
      },
    },
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
