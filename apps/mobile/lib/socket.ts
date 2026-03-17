import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000'

interface RatingUpdatedEvent {
  stationId: string
  avgRating: number
  reviewCount: number
  updatedAt: string
}

type SocketEvents = {
  'rating:updated': (data: RatingUpdatedEvent) => void
  connect: () => void
  disconnect: (reason: string) => void
  connect_error: (err: Error) => void
}

let socket: Socket<SocketEvents> | null = null

export function getSocket(): Socket<SocketEvents> {
  if (!socket) {
    socket = io(`${WS_URL}/stations`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: false,
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected to /stations')
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`)
    })

    socket.on('connect_error', (err) => {
      console.warn(`[Socket] Connection error: ${err.message}`)
    })
  }

  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}

export function onRatingUpdated(
  cb: (data: RatingUpdatedEvent) => void,
): () => void {
  const s = getSocket()
  s.on('rating:updated', cb)
  return () => s.off('rating:updated', cb)
}
