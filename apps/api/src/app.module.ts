import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bull'
import Redis from 'ioredis'
import configuration from './config/configuration'
import { DbModule } from './db/db.module'
import { AuthModule } from './modules/auth/auth.module'
import { StationsModule } from './modules/stations/stations.module'
import { ReviewsModule } from './modules/reviews/reviews.module'
import { StorageModule } from './modules/storage/storage.module'
import { AppController } from './app.controller'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 30,
      },
      {
        name: 'medium',
        ttl: 600000,
        limit: 100,
      },
    ]),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        createClient: (type: string) => {
          const url = config.get<string>('redis.url') ?? 'redis://localhost:6379'
          if (type === 'client') return new Redis(url)
          return new Redis(url, { enableReadyCheck: false, maxRetriesPerRequest: null })
        },
      }),
    }),

    DbModule,
    AuthModule,
    StationsModule,
    ReviewsModule,
    StorageModule,
  ],
})
export class AppModule {}
