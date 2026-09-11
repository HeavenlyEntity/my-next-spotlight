import { defineConfig } from 'vitest/config'
import { BaseSequencer } from 'vitest/node'
import path from 'node:path'

/*
 * The customer simulation. Deliberately separate from `pnpm test`.
 *
 * `pnpm test` is hermetic: no network, no database, safe in CI. These files
 * are the opposite on purpose -- they drive the real server action against
 * the real Creem test API, write to the real database, and send real mail
 * through Resend. That is the whole point: the 500 that shipped past a clean
 * build, a clean typecheck and 379 green tests was only ever going to be
 * caught by something that actually submits.
 *
 * Run it with `pnpm sim`. It needs .env.local, which the setup file loads
 * directly -- Vite only exposes VITE_-prefixed variables, and every secret
 * here is unprefixed.
 *
 * The buyer address is Resend's sink (delivered@resend.dev): the mail is
 * genuinely sent and genuinely rendered, and no human receives it.
 */
const root = process.cwd()

export default defineConfig({
  resolve: {
    alias: {
      '@payload-config': path.join(root, 'src/payload.config.ts'),
      '@': path.join(root, 'src'),
    },
  },
  test: {
    name: 'sim',
    environment: 'node',
    include: ['sim/*.sim.test.mjs'],
    setupFiles: ['./sim/env.setup.mjs'],
    testTimeout: 120000,
    hookTimeout: 120000,
    /* Shared database rows and one Creem account: these must not interleave. */
    fileParallelism: false,
    sequence: {
      concurrent: false,
      /* Vitest's default sequencer orders files by how long they took last
         time, which silently ran the journey before the catalogue it reads.
         Here the numeric filename prefixes ARE the order, so sort by name. */
      sequencer: class extends BaseSequencer {
        async sort(files) {
          return [...files].sort((a, b) => a.moduleId.localeCompare(b.moduleId))
        }
      },
    },
  },
})
