import { Skeleton } from '~/components/ui/skeleton'

export function ListCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width={60} height={24} />
      </div>
      <Skeleton variant="text" width="80%" height={16} />
      <div className="flex gap-2">
        <Skeleton variant="text" width={80} height={24} />
        <Skeleton variant="text" width={80} height={24} />
      </div>
    </div>
  )
}

export function ListCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <ListCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StoreCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle/50 p-4 space-y-2">
      <Skeleton variant="text" width="70%" height={20} />
      <Skeleton variant="text" width="50%" height={16} />
      <Skeleton variant="text" width={100} height={24} />
    </div>
  )
}

export function PriceRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border">
      <div className="space-y-1">
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width={80} height={14} />
      </div>
      <Skeleton variant="text" width={60} height={20} />
    </div>
  )
}
