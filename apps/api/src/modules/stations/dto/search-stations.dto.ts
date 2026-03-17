import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchStationsDto {
  @IsString()
  @IsOptional()
  q?: string

  @IsString()
  @IsOptional()
  province?: string

  @IsString()
  @IsOptional()
  brand?: string

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number
}
