import { IsString, IsIn } from 'class-validator'

export class VoteReviewDto {
  @IsString()
  @IsIn(['helpful', 'spam'])
  vote: string

  @IsString()
  deviceHash: string
}
