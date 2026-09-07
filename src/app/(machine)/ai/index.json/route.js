import { documentIndex } from '@/lib/ai/documents'
import { exportResponse } from '@/lib/ai/responses'
export async function GET() {
  try {
    return exportResponse(
      JSON.stringify({ documents: await documentIndex() }),
      'application/json'
    )
  } catch {
    return exportResponse(
      JSON.stringify({ error: 'Sources unavailable. Retry in one minute.' }),
      'application/json',
      503
    )
  }
}
