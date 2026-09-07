import { notFound } from 'next/navigation'
import { getDocument } from '@/lib/ai/documents'
import {
  MachineDocument,
  MachineUnavailable,
} from '@/components/ai/MachineDocument'
export const dynamic = 'force-dynamic'
export async function generateMetadata({ params, searchParams }) {
  const { path } = await params
  const page = Number((await searchParams).page ?? 1)
  try {
    const doc = await getDocument(path.join('/'), page)
    if (!doc) return { title: 'Document not found', robots: { index: false } }
    return {
      title: doc.title,
      description: doc.summary,
      alternates: {
        canonical: doc.id === 'home' ? doc.machine : doc.source,
        types: {
          'text/markdown': doc.markdown + (page > 1 ? '?page=' + page : ''),
        },
      },
    }
  } catch {
    return { title: 'Source unavailable', robots: { index: false } }
  }
}
export default async function MachinePage({ params, searchParams }) {
  const { path } = await params
  const id = path.join('/')
  let doc
  try {
    doc = await getDocument(id, Number((await searchParams).page ?? 1))
  } catch {
    return <MachineUnavailable id={id} />
  }
  if (!doc) notFound()
  return <MachineDocument doc={doc} />
}
