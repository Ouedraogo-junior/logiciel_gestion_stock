'use client'
// components/main-content.tsx
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigation } from '@/components/navigation-context'

// ─── Déclaré HORS de tout composant ──────────────────────────────────────────
function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

function SkeletonDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <Pulse className="h-6 w-40 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <Pulse className="h-2.5 w-20 mb-2" />
            <Pulse className="h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <Pulse className="h-4 w-32 mb-4" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex justify-between py-2 border-b border-gray-100">
                <Pulse className="h-3 w-32" />
                <Pulse className="h-3 w-16" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonDetail() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Pulse className="h-8 w-8 rounded-lg" />
        <Pulse className="h-5 w-40" />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <Pulse className="h-4 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Pulse className="h-2.5 w-20 mb-2" />
              <Pulse className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <Pulse className="h-4 w-24 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
            <Pulse className="h-3 flex-1" />
            <Pulse className="h-3 w-10" />
            <Pulse className="h-3 w-16" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonStats() {
  return (
    <div className="max-w-6xl mx-auto">
      <Pulse className="h-6 w-36 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <Pulse className="h-2.5 w-20 mb-2" />
            <Pulse className="h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <Pulse className="h-2.5 w-24 mb-2" />
            <Pulse className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <Pulse className="h-4 w-32 mb-4" />
        {Array.from({ length: 5 }).map((_, j) => (
          <div key={j} className="flex justify-between py-2 border-b border-gray-100">
            <Pulse className="h-3 w-40" />
            <Pulse className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Pulse className="h-6 w-32" />
        <Pulse className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <Pulse className="h-2.5 w-24 mb-2" />
            <Pulse className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-5">
        <Pulse className="h-9 flex-1 rounded-lg" />
        <Pulse className="h-9 w-32 rounded-lg" />
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>
      {/* Table desktop */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Pulse key={i} className="h-3 flex-1 max-w-[100px]" />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-4 items-center">
            {Array.from({ length: 6 }).map((_, j) => (
              <Pulse key={j} className={`h-3 flex-1 ${j === 0 ? 'max-w-[80px]' : j === 5 ? 'max-w-[60px]' : 'max-w-[120px]'}`} />
            ))}
          </div>
        ))}
      </div>
      {/* Cards mobile */}
      <div className="sm:hidden flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between mb-3">
              <div className="flex flex-col gap-2">
                <Pulse className="h-3 w-32" />
                <Pulse className="h-2.5 w-20" />
              </div>
              <Pulse className="h-5 w-14 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Pulse className="h-2 w-10" />
                  <Pulse className="h-3 w-14" />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Pulse className="h-2.5 w-20" />
              <Pulse className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NavigationSkeleton({ pathname }: { pathname: string }) {
  if (pathname === '/dashboard') return <SkeletonDashboard />
  if (pathname === '/stats') return <SkeletonStats />
  if (pathname.match(/\/(products|orders)\/[^/]+$/)) return <SkeletonDetail />
  return <SkeletonList />
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { navigating, setNavigating } = useNavigation()

  useEffect(() => {
    setNavigating(false)
  }, [pathname])

  return (
    <main className="flex-1 overflow-y-auto pt-14 md:pt-0 relative">
      {navigating && (
        <div className="absolute inset-0 z-30 bg-gray-100 p-4 sm:p-6">
          <NavigationSkeleton pathname={pathname} />
        </div>
      )}
      {children}
    </main>
  )
}