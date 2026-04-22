import { useState, useRef, useEffect } from 'react'
import { Button } from '@ssc/ui'
import { SkipForward } from 'lucide-react'

export function TypingMode({
  currentWord,
  onSubmit,
  onSkip,
  isActive,
}: {
  currentWord: string
  onSubmit: (typed: string) => void
  onSkip: () => void
  isActive: boolean
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isActive) inputRef.current?.focus()
  }, [isActive, currentWord])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || !isActive) return
    onSubmit(value.trim())
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault()
      onSkip()
      setValue('')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isActive}
          placeholder="Type the highlighted word..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 bg-bg-muted border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent text-lg font-mono disabled:opacity-50"
        />
        <Button type="submit" disabled={!value.trim() || !isActive}>
          Enter
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Press Enter to submit, Tab to skip</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSkip()
            setValue('')
          }}
          disabled={!isActive}
        >
          <SkipForward className="w-3 h-3" />
          Skip
        </Button>
      </div>
    </div>
  )
}
