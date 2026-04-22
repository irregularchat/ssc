import React from 'react'

export const SkeletonText = React.memo(({ className = 'h-4 w-3/4' }: { className?: string }) => (
  <div className={`rounded animate-shimmer ${className}`} />
))

export const SkeletonPill = React.memo(() => (
  <div className="h-7 w-20 rounded-full animate-shimmer shrink-0" />
))

export const SkeletonCard = React.memo(() => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg animate-shimmer" />
      <SkeletonText className="h-5 w-32" />
    </div>
    <SkeletonText className="h-4 w-48 mb-2" />
    <div className="flex gap-2 mt-3">
      <div className="h-10 flex-1 rounded-xl animate-shimmer" />
      <div className="h-10 w-16 rounded-xl animate-shimmer" />
    </div>
  </div>
))

export const SkeletonBuildingRow = React.memo(() => (
  <div className="px-4 py-3 border-b border-gray-100">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="w-4 h-4 rounded animate-shimmer" />
      <SkeletonText className="h-4 w-24" />
      <div className="h-4 w-14 rounded-full animate-shimmer" />
    </div>
    <SkeletonText className="h-3 w-40 ml-6" />
  </div>
))

/** Render multiple skeleton rows for a building list */
export function SkeletonBuildingList({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBuildingRow key={i} />
      ))}
    </>
  )
}

/** Render skeleton pills for category filters */
export function SkeletonPills({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonPill key={i} />
      ))}
    </>
  )
}
