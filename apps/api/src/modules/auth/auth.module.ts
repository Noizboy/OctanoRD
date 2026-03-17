import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { AuthController } from './auth.controller'
import { OtpService } from './otp.service'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiry') ?? '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    OtpService,
    JwtStrategy,
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('redis.url') ?? 'redis://localhost:6379'
        return new Redis(url)
      },
    },
  ],
  exports: [OtpService, JwtModule, PassportModule, 'REDIS'],
})
export class AuthModule {}
