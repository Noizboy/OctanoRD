import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Serve uploaded receipts as static files
  const uploadsPath = process.env.STORAGE_LOCAL_PATH ?? join(process.cwd(), 'uploads')
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' })

  // Increase JSON body limit for large payloads
  app.useBodyParser('json', { limit: '15mb' })
  app.useBodyParser('urlencoded', { limit: '15mb', extended: true })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-turnstile-token'],
    credentials: true,
  })

  app.setGlobalPrefix('api/v1')

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`OctanoRD API running on port ${port}`)
}

bootstrap()
