import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import { Media } from '../src/collections/Media'

// Deliberately scoped to uploading into the existing Media collection. This
// command never loads the application adapter's development schema-push path.
export default buildConfig({
  admin: { disable: true },
  telemetry: false,
  collections: [Media],
  secret: process.env.PAYLOAD_SECRET || '',
  logger: { options: { level: 'silent' } },
  typescript: { autoGenerate: false },
  db: postgresAdapter({
    push: false,
    disableCreateDatabase: true,
    // Payload's adapter retains its startup connection; uploads need a second.
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      max: 2,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
