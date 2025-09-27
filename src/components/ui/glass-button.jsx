import React from 'react'
import { cva } from 'class-variance-authority'

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

const glassButtonVariants = cva(
  'relative isolate cursor-pointer rounded-full transition-all',
  {
    variants: {
      size: {
        default: 'text-base font-medium',
        sm: 'text-sm font-medium',
        lg: 'text-lg font-medium',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

const glassButtonTextVariants = cva(
  'glass-button-text relative block select-none tracking-tighter',
  {
    variants: {
      size: {
        default: 'px-6 py-3.5',
        sm: 'px-4 py-2',
        lg: 'px-8 py-4',
        icon: 'flex h-10 w-10 items-center justify-center',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export const GlassButton = React.forwardRef(function GlassButton(
  { className, children, size, contentClassName, onClick, type = 'button', ...props },
  ref
) {
  return (
    <div className={cn('glass-button-wrap cursor-pointer rounded-full', className)}>
      <button
        type={type}
        className={cn('glass-button', glassButtonVariants({ size }))}
        ref={ref}
        onClick={onClick}
        {...props}
      >
        <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>
          {children}
        </span>
      </button>
      <div className="glass-button-shadow rounded-full" />
    </div>
  )
})

export { glassButtonVariants }


