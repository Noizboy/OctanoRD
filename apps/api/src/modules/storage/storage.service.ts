import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as MinioClient } from 'minio'
import { randomUUID } from 'crypto'

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name)
  private readonly minio: MinioClient
  private readonly bucket: string

  constructor(private readonly config: ConfigService) {
    this.minio = new MinioClient({
      endPoint: config.get<string>('minio.endpoint') ?? 'localhost',
      port: config.get<number>('minio.port') ?? 9000,
      useSSL: config.get<boolean>('minio.useSSL') ?? false,
      accessKey: config.get<string>('minio.accessKey') ?? 'minioadmin',
      secretKey: config.get<string>('minio.secretKey') ?? 'minioadmin',
    })
    this.bucket = config.get<string>('minio.bucketReceipts') ?? 'receipts'
  }

  async onModuleInit() {
    try {
      const exists = await this.minio.bucketExists(this.bucket)
      if (!exists) {
        await this.minio.makeBucket(this.bucket)
        this.logger.log(`Bucket "${this.bucket}" created`)
      }
    } catch (err) {
      this.logger.warn(`MinIO init warning: ${(err as Error).message}`)
    }
  }

  async upload(
    buffer: Buffer,
    mimetype: string,
    folder: string = 'receipts',
  ): Promise<string> {
    const ext = mimetype.split('/')[1] ?? 'jpg'
    const key = `${folder}/${randomUUID()}.${ext}`

    await this.minio.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimetype,
    })

    this.logger.log(`Uploaded: ${key}`)
    return key
  }

  async download(path: string): Promise<Buffer> {
    const stream = await this.minio.getObject(this.bucket, path)
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  }

  async getPresignedUrl(path: string, expiry: number = 3600): Promise<string> {
    return this.minio.presignedGetObject(this.bucket, path, expiry)
  }

  async delete(path: string): Promise<void> {
    await this.minio.removeObject(this.bucket, path)
  }
}
