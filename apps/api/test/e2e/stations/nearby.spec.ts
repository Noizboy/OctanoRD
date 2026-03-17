import { test, expect } from '@playwright/test'
import { BASE_URL } from '../helpers/api'

test.describe('Stations - Nearby', () => {
  // Coordenadas: Santo Domingo, RD
  const SD_LAT = 18.4861
  const SD_LNG = -69.9312

  test('GET /stations/nearby retorna array', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/v1/stations/nearby`, {
      params: { lat: SD_LAT, lng: SD_LNG, radius: 10 },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /stations/nearby sin coordenadas retorna 400', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/v1/stations/nearby`)
    expect(res.status()).toBe(400)
  })

  test('GET /stations/nearby con radio invalido retorna 400', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/v1/stations/nearby`, {
      params: { lat: SD_LAT, lng: SD_LNG, radius: 999 },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /stations/search retorna array', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/v1/stations/search`, {
      params: { q: 'Shell' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /stations/:id con UUID inexistente retorna 404', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await request.get(`${BASE_URL}/api/v1/stations/${fakeId}`)
    expect(res.status()).toBe(404)
  })
})
