import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import type { Request } from 'express'

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
}

@Injectable()
export class TurnstileGuard implements CanActivate {
  private readonly logger = new Logger(TurnstileGuard.name)

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const nodeEnv = this.config.get<string>('nodeEnv')
    if (nodeEnv === 'development') {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const token = request.headers['x-turnstile-token'] as string | undefined

    if (!token) {
      throw new ForbiddenException('Turnstile token requerido')
    }

    const secretKey = this.config.get<string>('cloudflare.turnstileSecretKey')
    if (!secretKey) {
      this.logger.warn('Turnstile secret key not configured, skipping verification')
      return true
    }

    try {
      const response = await axios.post<TurnstileResponse>(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: request.ip ?? '',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )

      if (!response.data.success) {
        this.logger.warn('Turnstile verification failed', response.data['error-codes'])
        throw new ForbiddenException('Verificacion de seguridad fallida')
      }

      return true
    } catch (err) {
      if (err instanceof ForbiddenException) throw err
      this.logger.error('Turnstile API error', (err as Error).message)
      throw new ForbiddenException('Error verificando token de seguridad')
    }
  }
}
