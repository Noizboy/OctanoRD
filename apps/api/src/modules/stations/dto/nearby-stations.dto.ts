import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class NearbyStationsDto {
  @Type(() => Number)
  @IsNumber()
  lat: number

  @Type(() => Number)
  @IsNumber()
  lng: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0.5)
  @Max(50)
  radius?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  minRating?: number

  @IsString()
  @IsOptional()
  brand?: string
}
