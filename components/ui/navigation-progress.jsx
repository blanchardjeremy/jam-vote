'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import LoadingBlock from '@/components/LoadingBlock'

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}

function NavigationProgressInner() {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, searchParams])

  if (!isNavigating) return null

  return (
    <LoadingBlock />
  )
} 