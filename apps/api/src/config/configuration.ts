export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://octano:octano_pass@localhost:5432/octanord',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucketReceipts: process.env.MINIO_BUCKET_RECEIPTS ?? 'receipts',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
    expiry: process.env.JWT_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '30d',
  },

  phone: {
    hashSalt: process.env.PHONE_HASH_SALT ?? 'dev_salt_change_in_production',
  },

  google: {
    visionApiKey: process.env.GOOGLE_VISION_API_KEY ?? '',
  },

  cloudflare: {
    turnstileSecretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ?? '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    verifyServiceId: process.env.TWILIO_VERIFY_SERVICE_ID ?? '',
  },
})
