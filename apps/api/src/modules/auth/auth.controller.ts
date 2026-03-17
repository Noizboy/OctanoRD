import { Controller, Post, Body } from '@nestjs/common'
import { OtpService } from './otp.service'
import { RequestOtpDto } from './dto/request-otp.dto'
import { VerifyOtpDto } from './dto/verify-otp.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly otpService: OtpService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.otpService.sendOtp(dto.phone)
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto.phone, dto.code)
  }

  @Post('token/refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.otpService.refreshAccessToken(dto.refreshToken)
  }
}
