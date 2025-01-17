'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Spinner } from './spinner'

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, searchParams])

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center h-1 bg-indigo-50">
      <div className="h-1 bg-indigo-600 w-full animate-[progress_2s_ease-in-out_infinite]" />
      <Spinner className="absolute right-4 top-4 text-indigo-600" />
    </div>
  )
} 