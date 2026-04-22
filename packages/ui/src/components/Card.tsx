import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  children: ReactNode
  className?: string
  variant?: CardVariant
  padding?: CardPadding
  interactive?: boolean
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-bg-subtle',
  elevated: 'bg-bg-elevated shadow-xl shadow-black/20 border border-border/50',
  bordered: 'bg-bg-subtle/50 border border-border',
  glass: 'bg-bg-subtle/30 backdrop-blur-md border border-white/5',
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  children,
  className,
  variant = 'bordered',
  padding = 'md',
  interactive = false
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        interactive && 'hover:border-border-hover hover:bg-bg-subtle cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  )
}
