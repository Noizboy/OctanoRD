import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { VoteReviewDto } from './dto/vote-review.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { FraudInterceptor } from '../../common/interceptors/fraud.interceptor'

interface AuthRequest extends Request {
  user: { phoneHash: string }
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('mine')
  findMine(
    @Query('deviceHash') deviceHash: string,
    @Query('phoneHash') phoneHash?: string,
  ) {
    return this.reviewsService.findMine(deviceHash, phoneHash)
  }

  @Post()
  // TODO: Re-enable guards after OTP flow is implemented
  // @UseGuards(JwtAuthGuard)
  // @UseInterceptors(FraudInterceptor)
  create(@Body() dto: CreateReviewDto, @Request() req: AuthRequest) {
    const phoneHash = req.user?.phoneHash ?? 'dev-phone-hash'
    return this.reviewsService.create(dto, phoneHash)
  }

  @Post(':id/vote')
  vote(@Param('id') id: string, @Body() dto: VoteReviewDto) {
    return this.reviewsService.vote(id, dto)
  }

  @Post(':id/report')
  report(
    @Param('id') id: string,
    @Body('deviceHash') deviceHash: string,
  ) {
    return this.reviewsService.report(id, deviceHash)
  }
}
