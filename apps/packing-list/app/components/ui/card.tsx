import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'bordered' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const variantStyles = {
  default: 'bg-bg-subtle',
  elevated: 'bg-bg-elevated shadow-xl shadow-black/20 border border-border/50',
  bordered: 'bg-bg-subtle/50 border border-border',
  glass: 'bg-bg-subtle/30 backdrop-blur-md border border-white/5',
}

const paddingStyles = {
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
