import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { VoteReviewDto } from './dto/vote-review.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

interface AuthRequest extends Request {
  user: { phoneHash: string }
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReviewDto, @Request() req: AuthRequest) {
    return this.reviewsService.create(dto, req.user.phoneHash)
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
