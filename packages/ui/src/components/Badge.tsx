import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline'
type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-bg-elevated text-text-secondary border-border',
  primary: 'bg-text-primary text-bg border-transparent',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
  outline: 'bg-transparent border-border text-text-muted',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 h-5',
  md: 'text-xs px-2.5 py-1 h-6',
}

export function Badge({ children, variant = 'default', size = 'md', dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium font-mono rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', variant === 'success' ? 'bg-success' : 'bg-current')} />}
      {children}
    </span>
  )
}
