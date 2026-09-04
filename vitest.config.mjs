import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/* Two projects: the pure engine runs in node with relative imports only;
   the founders UI runs in jsdom with the @ alias, jest-dom matchers, and
   the Next.js mocks from vitest.setup.js. */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'engine',
          environment: 'node',
          include: ['src/lib/**/__tests__/**/*.test.js'],
        },
      },
      {
        plugins: [react()],
        resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: [
            'src/components/**/__tests__/**/*.test.jsx',
            'src/app/**/__tests__/**/*.test.jsx',
          ],
          setupFiles: ['./vitest.setup.js'],
        },
      },
    ],
  },
})
