import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  namespace: '/stations',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class StationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(StationsGateway.name)

  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  emitRatingUpdate(
    stationId: string,
    avgRating: number,
    reviewCount: number,
  ) {
    this.server.emit('rating:updated', {
      stationId,
      avgRating,
      reviewCount,
      updatedAt: new Date().toISOString(),
    })
  }
}
