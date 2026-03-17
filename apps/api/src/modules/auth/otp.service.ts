import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as crypto from 'crypto'
import type { Redis } from 'ioredis'
import axios from 'axios'

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)

  constructor(
    private readonly config: ConfigService,
    @Inject('REDIS') private readonly redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  private hashPhone(phone: string): string {
    const salt = this.config.get<string>('phone.hashSalt')!
    return crypto.createHash('sha256').update(phone + salt).digest('hex')
  }

  private generateOtpCode(): string {
    const bytes = crypto.randomBytes(3)
    const num = bytes.readUIntBE(0, 3) % 1000000
    return num.toString().padStart(6, '0')
  }

  async sendOtp(phone: string): Promise<{ message: string }> {
    const phoneHash = this.hashPhone(phone)
    const code = this.generateOtpCode()

    // Guardar en Redis con expiración de 10 minutos
    await this.redis.set(`otp:${phoneHash}`, code, 'EX', 600)

    // Enviar via Twilio Verify (WhatsApp)
    const accountSid = this.config.get<string>('twilio.accountSid')
    const authToken = this.config.get<string>('twilio.authToken')
    const verifyServiceId = this.config.get<string>('twilio.verifyServiceId')

    if (accountSid && authToken && verifyServiceId) {
      try {
        const url = `https://verify.twilio.com/v2/Services/${verifyServiceId}/Verifications`
        await axios.post(
          url,
          new URLSearchParams({ To: phone, Channel: 'whatsapp' }),
          {
            auth: { username: accountSid, password: authToken },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        )
      } catch (err) {
        this.logger.warn(`Twilio error: ${(err as Error).message}. Using Redis-only OTP for dev.`)
      }
    } else {
      this.logger.log(`[DEV] OTP for ${phone}: ${code}`)
    }

    return { message: 'OTP enviado' }
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const phoneHash = this.hashPhone(phone)
    const storedCode = await this.redis.get(`otp:${phoneHash}`)

    if (!storedCode) {
      throw new UnauthorizedException('OTP expirado o no encontrado')
    }

    const codeBuffer = Buffer.from(code.padEnd(64))
    const storedBuffer = Buffer.from(storedCode.padEnd(64))

    let valid = false
    try {
      valid = crypto.timingSafeEqual(codeBuffer, storedBuffer) && code === storedCode
    } catch {
      valid = false
    }

    if (!valid) {
      throw new UnauthorizedException('Codigo OTP invalido')
    }

    await this.redis.del(`otp:${phoneHash}`)

    const jwtSecret = this.config.get<string>('jwt.secret')
    const accessExpiry = this.config.get<string>('jwt.expiry') ?? '15m'
    const refreshExpiry = this.config.get<string>('jwt.refreshExpiry') ?? '30d'

    const accessToken = this.jwtService.sign(
      { sub: phoneHash, type: 'access' },
      { secret: jwtSecret, expiresIn: accessExpiry },
    )

    const refreshToken = this.jwtService.sign(
      { sub: phoneHash, type: 'refresh' },
      { secret: jwtSecret, expiresIn: refreshExpiry },
    )

    // Guardar refreshToken en Redis por 30 días
    await this.redis.set(`refresh:${phoneHash}`, refreshToken, 'EX', 2592000)

    return { accessToken, refreshToken }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    let payload: { sub: string; type: string }

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.secret'),
      })
    } catch {
      throw new UnauthorizedException('Refresh token invalido')
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token type invalido')
    }

    const stored = await this.redis.get(`refresh:${payload.sub}`)
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh token revocado')
    }

    const jwtSecret = this.config.get<string>('jwt.secret')
    const accessExpiry = this.config.get<string>('jwt.expiry') ?? '15m'

    const accessToken = this.jwtService.sign(
      { sub: payload.sub, type: 'access' },
      { secret: jwtSecret, expiresIn: accessExpiry },
    )

    return { accessToken }
  }

  async revokeRefreshToken(phoneHash: string): Promise<void> {
    await this.redis.del(`refresh:${phoneHash}`)
  }
}
