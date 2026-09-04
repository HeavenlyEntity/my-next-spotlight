'use client'

import { Dialog as SheetPrimitive } from 'radix-ui'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/* Sheet on the radix-ui umbrella, mapped onto the amw tokens like
   select.jsx. The portaled content carries the `amw` scope itself so the
   tokens resolve outside a page's .amw wrapper. Pass `modal={false}` on
   <Sheet> for glanceable panels (no scrim, no focus trap, Escape still
   closes). */

function Sheet(props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal(props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40',
        className
      )}
      {...props}
    />
  )
}

const SIDES = {
  right:
    'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
  top: 'inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom:
    'inset-x-0 bottom-0 h-auto rounded-t-2xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
}

function SheetContent({
  className,
  children,
  side = 'right',
  overlay = true,
  showClose = true,
  ...props
}) {
  return (
    <SheetPortal>
      {overlay && <SheetOverlay />}
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'amw border-[var(--amw-line)] bg-[var(--amw-card)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 fixed z-50 flex flex-col gap-4 text-zinc-900 shadow-lg shadow-black/10 transition duration-300 ease-in-out dark:text-zinc-100',
          SIDES[side],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <SheetPrimitive.Close className="hover:bg-[var(--amw-muted)] absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-md text-zinc-500 transition-colors focus:outline-none dark:text-zinc-400">
            <XIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-5', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-5', className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        'text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100',
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-zinc-600 dark:text-zinc-400', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
