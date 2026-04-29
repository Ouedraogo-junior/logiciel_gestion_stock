//── app/(back-office)/debts/loading.tsx ──────────────────────────────────────
import Skeleton from '@/components/skeleton'
export default function Loading() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mb-6" />
      <Skeleton variant="stats" cols={3} />
      <Skeleton variant="table" rows={6} cols={8} />
    </div>
  )
}
