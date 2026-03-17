import { IsString, Matches } from 'class-validator'

export class RequestOtpDto {
  @IsString()
  @Matches(/^\+1[89][02-9]\d{7}$|^\+\d{7,15}$/, {
    message: 'Numero de telefono invalido',
  })
  phone: string
}
