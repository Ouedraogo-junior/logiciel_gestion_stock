// components/skeleton.tsx
// Usage :
//   <Skeleton variant="table" rows={6} />
//   <Skeleton variant="cards" rows={4} />
//   <Skeleton variant="stats" cols={3} />
//   <Skeleton variant="detail" />
//   <Skeleton variant="dashboard" />

type SkeletonProps =
  | { variant: 'table'; rows?: number; cols?: number }
  | { variant: 'cards'; rows?: number }
  | { variant: 'stats'; cols?: number }
  | { variant: 'detail' }
  | { variant: 'dashboard' }

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

// ─── Table desktop skeleton ───────────────────────────────────────────────────
function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Pulse key={i} className="h-3 flex-1 max-w-[100px]" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Pulse key={j} className={`h-3 flex-1 ${j === 0 ? 'max-w-[80px]' : j === cols - 1 ? 'max-w-[60px]' : 'max-w-[120px]'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Cards mobile skeleton ────────────────────────────────────────────────────
function CardsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="sm:hidden flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
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
          <div className="flex justify-between items-center">
            <Pulse className="h-2.5 w-20" />
            <Pulse className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stats row skeleton ───────────────────────────────────────────────────────
function StatsSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-3 mb-5`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
          <Pulse className="h-2.5 w-24 mb-2" />
          <Pulse className="h-7 w-20" />
        </div>
      ))}
    </div>
  )
}

// ─── Detail page skeleton ─────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
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
        {Array.from({ length: 3 }).map((_, i) => (
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

// ─── Dashboard skeleton ───────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <Pulse className="h-6 w-40 mb-6" />
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <Pulse className="h-2.5 w-20 mb-2" />
            <Pulse className="h-7 w-24" />
          </div>
        ))}
      </div>
      {/* Two columns */}
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

// ─── Export principal ─────────────────────────────────────────────────────────
export default function Skeleton(props: SkeletonProps) {
  if (props.variant === 'table') {
    return (
      <>
        <TableSkeleton rows={props.rows} cols={props.cols} />
        <CardsSkeleton rows={props.rows} />
      </>
    )
  }
  if (props.variant === 'cards') return <CardsSkeleton rows={props.rows} />
  if (props.variant === 'stats') return <StatsSkeleton cols={props.cols} />
  if (props.variant === 'detail') return <DetailSkeleton />
  if (props.variant === 'dashboard') return <DashboardSkeleton />
  return null
}