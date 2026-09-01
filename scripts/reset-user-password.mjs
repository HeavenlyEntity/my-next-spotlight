#!/usr/bin/env node
/**
 * Reset a Payload CMS user's password from the command line.
 *
 * Connects straight to Postgres (DATABASE_URI from .env.local) and writes a
 * new salt/hash pair using the exact same pbkdf2 parameters as Payload's
 * local auth strategy (crypto.pbkdf2, 25000 iterations, keylen 512, sha256).
 * No app bootstrap or TS loader needed, so it runs on plain Node.
 *
 * Usage:
 *   pnpm reset:password <email> [new-password]
 *
 * Omit the password to have a secure random one generated and printed —
 * preferred, since a password typed as an argument lands in shell history.
 */
import crypto from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(file) {
  const full = path.join(root, file)
  if (!existsSync(full)) return
  for (const line of readFileSync(full, 'utf8').split('\n')) {
    const match = line.match(
      /^\s*(?:export\s+)?([A-Za-z_][\w.]*)\s*=\s*(.*)\s*$/
    )
    if (!match) continue
    const key = match[1]
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2')
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

function pbkdf2(password, salt) {
  return new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (err, hashRaw) =>
      err ? reject(err) : resolve(hashRaw)
    )
  )
}

function usage() {
  console.log('Usage: pnpm reset:password <email> [new-password]')
  console.log(
    'Omit the password to have a secure random one generated and printed.'
  )
}

async function run() {
  const [email, providedPassword] = process.argv.slice(2)
  if (!email || email === '--help' || email === '-h') {
    usage()
    process.exit(email ? 0 : 1)
  }

  if (!process.env.DATABASE_URI) {
    console.error('DATABASE_URI is not set (checked .env.local and .env).')
    process.exit(1)
  }

  const password =
    providedPassword || crypto.randomBytes(12).toString('base64url')
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = (await pbkdf2(password, salt)).toString('hex')

  const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
  await client.connect()

  try {
    const { rows } = await client.query(
      'UPDATE users SET salt = $1, hash = $2 WHERE lower(email) = lower($3) RETURNING email',
      [salt, hash, email]
    )

    if (rows.length === 0) {
      console.error(`No user found with email "${email}".`)
      const all = await client.query('SELECT email FROM users ORDER BY email')
      if (all.rows.length > 0) {
        console.error('Existing users:')
        for (const u of all.rows) console.error(`  - ${u.email}`)
      } else {
        console.error(
          'No users exist yet — visit /admin to create the first user.'
        )
      }
      process.exit(1)
    }

    // Clear any failed-login lockout so the new password works immediately.
    // Columns only exist when lockouts are enabled, so failure here is fine.
    try {
      await client.query(
        'UPDATE users SET login_attempts = 0, lock_until = NULL WHERE lower(email) = lower($1)',
        [email]
      )
    } catch {
      // best-effort
    }

    console.log(`✔ Password reset for ${rows[0].email}`)
    if (!providedPassword) {
      console.log(`  New password: ${password}`)
    }
    console.log(
      '  Sign in at /admin — consider changing the password again from your account settings.'
    )
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
