import { clsx } from 'clsx'

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function StatsBar({
  progress,
  accuracy,
  wpm,
  elapsedMs,
  wordsCompleted,
  totalWords,
  className,
}: {
  progress: number
  accuracy: number
  wpm: number
  elapsedMs: number
  wordsCompleted: number
  totalWords: number
  className?: string
}) {
  return (
    <div className={clsx('space-y-3', className)}>
      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Practice progress"
        className="w-full bg-bg-muted rounded-full h-2 overflow-hidden"
      >
        <div
          className="bg-accent h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <div className="flex items-center gap-4">
          <span>
            {wordsCompleted}/{totalWords} words
          </span>
          <span
            className={clsx(
              accuracy >= 80
                ? 'text-success'
                : accuracy >= 50
                  ? 'text-warning'
                  : 'text-error'
            )}
          >
            {accuracy}% accuracy
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{wpm} WPM</span>
          <span className="font-mono">{formatTime(elapsedMs)}</span>
        </div>
      </div>
    </div>
  )
}
