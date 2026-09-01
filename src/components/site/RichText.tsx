import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/utils'

// Derive the data type from the component itself — robust against version drift,
// no fragile subpath type import.
type Props = {
  data?: React.ComponentProps<typeof LexicalRichText>['data'] | null
  className?: string
}

export function RichText({ data, className }: Props) {
  if (!data) return null
  return (
    <div
      className={cn('prose prose-zinc dark:prose-invert max-w-none', className)}
    >
      <LexicalRichText data={data} />
    </div>
  )
}
