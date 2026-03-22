import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name)
  private readonly storagePath: string

  constructor(private readonly config: ConfigService) {
    this.storagePath =
      config.get<string>('storage.localPath') ??
      path.join(process.cwd(), 'uploads')
  }

  async onModuleInit() {
    try {
      await fs.mkdir(path.join(this.storagePath, 'receipts'), { recursive: true })
      this.logger.log(`Local storage ready at: ${this.storagePath}`)
    } catch (err) {
      this.logger.error(`Storage init error: ${(err as Error).message}`)
    }
  }

  async upload(
    buffer: Buffer,
    mimetype: string,
    folder: string = 'receipts',
  ): Promise<string> {
    const ext = mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const key = `${folder}/${randomUUID()}.${ext}`
    const fullPath = path.join(this.storagePath, key)

    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, buffer)

    this.logger.log(`Uploaded: ${key}`)
    return key
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.storagePath, filePath)
    return fs.readFile(fullPath)
  }

  async getPresignedUrl(filePath: string, _expiry: number = 3600): Promise<string> {
    // In local mode, return a relative path served by the static file handler
    return `/uploads/${filePath}`
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.storagePath, filePath)
    try {
      await fs.unlink(fullPath)
    } catch {
      // File may not exist, ignore
    }
  }
}
