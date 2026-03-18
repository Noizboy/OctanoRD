import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface JwtPayload {
  phoneHash: string
  sub: string
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>()
    return request.user
  },
)
