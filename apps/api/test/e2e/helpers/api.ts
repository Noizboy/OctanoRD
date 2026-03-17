import { type APIRequestContext } from '@playwright/test'

export const BASE_URL = process.env.API_URL ?? 'http://localhost:3000'

export async function healthCheck(request: APIRequestContext) {
  return request.get(`${BASE_URL}/health`)
}

// En dev, el OTP se loggea en consola y Twilio no es requerido.
// Para tests E2E, usar el endpoint debug (solo en NODE_ENV=test)
export async function getTestJwt(request: APIRequestContext, phone = '+18095551234'): Promise<string> {
  // Solicitar OTP
  await request.post(`${BASE_URL}/api/v1/auth/otp/request`, {
    data: { phone },
  })

  // En entorno de test, usar codigo de bypass
  const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/otp/verify`, {
    data: { phone, code: '000000' },
  })

  const body = await verifyRes.json() as { accessToken?: string }
  if (!body.accessToken) {
    throw new Error(`OTP verify failed: ${JSON.stringify(body)}`)
  }
  return body.accessToken
}
