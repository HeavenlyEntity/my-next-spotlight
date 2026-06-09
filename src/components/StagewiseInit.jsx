'use client'

import { useEffect } from 'react'
import { initToolbar } from '@21st-extension/toolbar'

export function StagewiseInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initToolbar({ plugins: [] })
    }
  }, [])
  return null
}
