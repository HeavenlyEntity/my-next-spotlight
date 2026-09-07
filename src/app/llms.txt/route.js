import { discovery } from '@/lib/ai/documents'
import { exportResponse } from '@/lib/ai/responses'
export function GET() {
  return discovery('llms.txt').then((text) =>
    exportResponse(text, 'text/plain')
  )
}
