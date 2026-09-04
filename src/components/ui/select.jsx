'use client'

import { Select as SelectPrimitive } from 'radix-ui'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/* Select, ported from Origin UI's "Enhanced shadcn/ui select" (sourced via
   21st.dev, id 276) and mapped onto the amw tokens. Origin UI's refinements
   over the stock shadcn version: rounded-lg trigger with a hairline
   shadow, a soft 3px focus ring, popper positioning by default, a menu
   capped at min(24rem, available height), a check-indicator gutter on
   every item, and padded groups. Uses the project's radix-ui umbrella
   package and lucide icons instead of @radix-ui/react-select + radix
   icons; React 19 forwards `ref` as a prop, so no forwardRef.

   Both the trigger and the (portaled) content carry the `amw` scope so
   the tokens resolve anywhere, including outside a page's .amw wrapper. */

function Select(props) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({ className, ...props }) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn('scroll-my-1', className)}
      {...props}
    />
  )
}

function SelectValue(props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({ className, children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'amw border-[var(--amw-line-strong)] bg-[var(--amw-card)] focus:border-[var(--amw-accent)] focus:ring-[var(--amw-accent)]/20 text-start data-[placeholder]:text-zinc-500 dark:data-[placeholder]:text-zinc-400 [&>span]:min-w-0 flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium text-zinc-900 shadow-sm shadow-black/5 outline-none transition-[border-color,box-shadow] focus:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon
          className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-zinc-500',
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-zinc-500',
        className
      )}
      {...props}
    >
      <ChevronDownIcon
        className="size-4"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

function SelectContent({ className, children, position = 'popper', ...props }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'amw border-[var(--amw-line)] bg-[var(--amw-card)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 [&_[role=group]]:py-1 relative z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[8rem] overflow-hidden rounded-lg border text-zinc-900 shadow-lg shadow-black/10 dark:text-zinc-100',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 w-full min-w-[var(--radix-select-trigger-width)]',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' && 'h-[var(--radix-select-trigger-height)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('amw-kicker pe-2 ps-8 py-1.5', className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'focus:bg-[var(--amw-muted)] data-[state=checked]:text-[var(--amw-accent-ink)] pe-3 ps-8 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 relative flex w-full cursor-default select-none items-center rounded-md py-2 text-sm text-zinc-800 outline-none dark:text-zinc-200',
        className
      )}
      {...props}
    >
      <span className="start-2.5 size-3.5 absolute flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" strokeWidth={2} aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-[var(--amw-line)] -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
