import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { StorageService } from './storage.service'
import type { Express } from 'express'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('receipt/upload')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new BadRequestException(
            `Tipo de archivo no permitido. Solo: ${ALLOWED_MIMETYPES.join(', ')}`,
          ), false)
        }
      },
    }),
  )
  async uploadReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido')
    }

    const path = await this.storageService.upload(
      file.buffer,
      file.mimetype,
      'receipts',
    )

    return { path, uploadId: path }
  }
}
