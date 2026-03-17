import { Controller, Get, Param, Query } from '@nestjs/common'
import { StationsService } from './stations.service'
import { NearbyStationsDto } from './dto/nearby-stations.dto'
import { SearchStationsDto } from './dto/search-stations.dto'

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get('nearby')
  findNearby(@Query() dto: NearbyStationsDto) {
    return this.stationsService.findNearby(dto)
  }

  @Get('search')
  search(@Query() dto: SearchStationsDto) {
    return this.stationsService.search(dto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id)
  }

  @Get(':id/reviews')
  getReviews(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.stationsService.getReviews(id, limit, offset)
  }
}
