import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve(process.cwd(), '.env.local')
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1)
  }
  process.env[m[1]] = v
}
