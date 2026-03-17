import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './apps/api/test/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,           // Tests E2E de API corren en serie para evitar colisiones de estado en Redis/DB

  use: {
    baseURL: process.env.API_URL ?? 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'api-e2e',
      testMatch: '**/*.spec.ts',
    },
  ],

  // Levanta la API antes de correr los tests (requiere Docker Compose ya corriendo)
  // webServer: {
  //   command: 'npm run start:dev --workspace=apps/api',
  //   url: 'http://localhost:3000/health',
  //   reuseExistingServer: true,
  //   timeout: 30_000,
  // },
})
