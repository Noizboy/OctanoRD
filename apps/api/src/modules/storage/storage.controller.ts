import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { StorageService } from './storage.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import type { Express } from 'express'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('receipt/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido')
    }

    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo: ${ALLOWED_MIMETYPES.join(', ')}`,
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Archivo demasiado grande. Maximo 10MB')
    }

    const path = await this.storageService.upload(
      file.buffer,
      file.mimetype,
      'receipts',
    )

    return { path, uploadId: path }
  }
}
