"use client"

import * as AvatarPrimitive from '@radix-ui/react-avatar'
import React from 'react'

import { cn } from '@/lib/utils'

const Avatar = React.forwardRef(function Avatar(
  { className, ...props },
  ref
) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
})

const AvatarImage = React.forwardRef(function AvatarImage(
  { className, ...props },
  ref
) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  )
})

const AvatarFallback = React.forwardRef(function AvatarFallback(
  { className, ...props },
  ref
) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-[inherit] bg-secondary text-xs',
        className
      )}
      {...props}
    />
  )
})

export { Avatar, AvatarFallback, AvatarImage }


