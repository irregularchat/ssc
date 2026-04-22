import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import type { WordState } from '~/hooks/use-practice-session'

const statusClasses: Record<string, string> = {
  upcoming: 'text-text-muted',
  current:
    'text-text-primary bg-accent-muted rounded px-1 -mx-1 font-semibold',
  correct: 'text-success',
  incorrect: 'text-error',
  skipped: 'text-text-muted line-through',
}

export function WordDisplay({
  words,
  className,
}: {
  words: WordState[]
  className?: string
}) {
  const currentRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [words.findIndex((w) => w.status === 'current')])

  return (
    <div
      className={clsx(
        'text-lg leading-relaxed max-h-64 overflow-y-auto p-4 rounded-xl bg-bg-subtle border border-border',
        className
      )}
    >
      {words.map((w, i) => (
        <span
          key={i}
          ref={w.status === 'current' ? currentRef : undefined}
          className={clsx(
            'inline transition-colors duration-200',
            statusClasses[w.status]
          )}
        >
          {w.word}{' '}
        </span>
      ))}
      {/* Screen reader announcement for current word */}
      <span className="sr-only" aria-live="polite">
        {(() => {
          const current = words.find(w => w.status === 'current')
          return current ? `Current word: ${current.word}` : 'All words complete'
        })()}
      </span>
    </div>
  )
}
