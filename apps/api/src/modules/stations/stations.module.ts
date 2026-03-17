import { Module } from '@nestjs/common'
import { StationsController } from './stations.controller'
import { StationsService } from './stations.service'
import { StationsGateway } from './stations.gateway'

@Module({
  controllers: [StationsController],
  providers: [StationsService, StationsGateway],
  exports: [StationsService, StationsGateway],
})
export class StationsModule {}
