import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const DB_TOKEN = 'DB'

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url')!
        const client = postgres(url, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        })
        return drizzle(client, { schema })
      },
    },
  ],
  exports: [DB_TOKEN],
})
export class DbModule {}
