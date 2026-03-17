import { test, expect } from '@playwright/test'
import { BASE_URL } from '../helpers/api'

test.describe('Auth OTP', () => {
  test('health check responde OK', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  test('POST /auth/otp/request acepta numero valido', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/auth/otp/request`, {
      data: { phone: '+18095551234' },
    })
    // 201 o 200 dependiendo del entorno (dev sin Twilio igual retorna ok)
    expect([200, 201]).toContain(res.status())
    const body = await res.json()
    expect(body.message).toBeTruthy()
  })

  test('POST /auth/otp/request rechaza numero invalido', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/auth/otp/request`, {
      data: { phone: '123' },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /auth/otp/request rechaza body vacio', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/auth/otp/request`, {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('POST /auth/otp/verify rechaza codigo incorrecto', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/auth/otp/verify`, {
      data: { phone: '+18095559999', code: '999999' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /auth/otp/verify rechaza codigo con formato invalido', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/auth/otp/verify`, {
      data: { phone: '+18095559999', code: 'abcdef' },
    })
    expect(res.status()).toBe(400)
  })
})
