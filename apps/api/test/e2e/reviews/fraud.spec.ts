import { test, expect } from '@playwright/test'
import { BASE_URL } from '../helpers/api'

test.describe('Reviews - Anti-fraude', () => {
  test('POST /reviews sin JWT retorna 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/reviews`, {
      data: {
        stationId: '00000000-0000-0000-0000-000000000000',
        stars: 5,
        fuelType: 'regular',
        deviceHash: 'test-hash',
        turnstileToken: 'test-token',
      },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /reviews con JWT invalido retorna 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/reviews`, {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
      data: {
        stationId: '00000000-0000-0000-0000-000000000000',
        stars: 5,
        fuelType: 'regular',
        deviceHash: 'test-hash',
        turnstileToken: 'test-token',
      },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /reviews/:id/vote con vote invalido retorna 400', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await request.post(`${BASE_URL}/api/v1/reviews/${fakeId}/vote`, {
      data: { deviceHash: 'abc', vote: 'invalid_vote' },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /storage/receipt/upload sin JWT retorna 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/storage/receipt/upload`, {
      multipart: {
        receipt: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake image data'),
        },
      },
    })
    expect(res.status()).toBe(401)
  })
})
