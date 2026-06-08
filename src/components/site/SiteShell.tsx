import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-auto">{children}</main>
        <SiteFooter />
      </div>
    </>
  )
}
