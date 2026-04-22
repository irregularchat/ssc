import { clsx } from 'clsx'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-bg-elevated/50',
        variant === 'circular' ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{
        width,
        height,
        ...style
      }}
      {...props}
    />
  )
}
