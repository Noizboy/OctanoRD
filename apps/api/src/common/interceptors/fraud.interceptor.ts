import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import type Redis from 'ioredis'

@Injectable()
export class FraudInterceptor implements NestInterceptor {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<{
      body: { deviceHash?: string; stationId?: string }
      user?: { phoneHash?: string }
    }>()

    const deviceHash = req.body?.deviceHash
    const stationId = req.body?.stationId
    const phoneHash = req.user?.phoneHash

    if (!deviceHash || !stationId) {
      return next.handle()
    }

    const deviceDailyKey = `rl:device:${deviceHash}:daily`
    const deviceStationKey = `rl:device:${deviceHash}:station:${stationId}`

    const [deviceDaily, deviceStation] = await Promise.all([
      this.redis.get(deviceDailyKey),
      this.redis.get(deviceStationKey),
    ])

    if (Number(deviceDaily) >= 3) {
      throw new HttpException(
        'Limite diario de calificaciones por dispositivo alcanzado',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    if (deviceStation) {
      throw new HttpException(
        'Ya calificaste esta gasolinera recientemente',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    if (phoneHash) {
      const phoneDailyKey = `rl:phone:${phoneHash}:daily`
      const phoneStationKey = `rl:phone:${phoneHash}:station:${stationId}`

      const [phoneDaily, phoneStation] = await Promise.all([
        this.redis.get(phoneDailyKey),
        this.redis.get(phoneStationKey),
      ])

      if (Number(phoneDaily) >= 5) {
        throw new HttpException(
          'Limite diario de calificaciones por telefono alcanzado',
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      if (phoneStation) {
        throw new HttpException(
          'Solo puedes calificar esta gasolinera una vez por semana',
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      const pipeline = this.redis.pipeline()
      pipeline.incr(phoneDailyKey)
      pipeline.expire(phoneDailyKey, 86400)
      pipeline.set(phoneStationKey, '1', 'EX', 604800) // 7 days
      await pipeline.exec()
    }

    const pipeline = this.redis.pipeline()
    pipeline.incr(deviceDailyKey)
    pipeline.expire(deviceDailyKey, 86400)
    pipeline.set(deviceStationKey, '1', 'EX', 604800)
    await pipeline.exec()

    return next.handle()
  }
}
