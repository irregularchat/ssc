import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Card } from './card'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card 
      variant="bordered" 
      padding="lg" 
      className={clsx('flex flex-col items-center justify-center text-center min-h-[200px]', className)}
    >
      {icon && (
        <div className="p-3 rounded-xl bg-bg-elevated border border-border mb-4 text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="font-medium text-text-primary text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-text-muted text-sm max-w-xs mx-auto mb-6">
          {description}
        </p>
      )}
      {action}
    </Card>
  )
}
