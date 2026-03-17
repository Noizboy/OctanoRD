import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator'

export class CreateReviewDto {
  @IsUUID()
  stationId: string

  @IsInt()
  @Min(1)
  @Max(5)
  stars: number

  @IsString()
  @IsIn(['regular', 'premium', 'gasoil_optimo', 'gasoil_regular'])
  fuelType: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string

  @IsString()
  @IsOptional()
  receiptUploadId?: string

  @IsString()
  deviceHash: string

  @IsString()
  turnstileToken: string
}
