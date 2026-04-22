import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@ssc/ui'
import { Play, Pause, Minus, Plus } from 'lucide-react'

export function KaraokeMode({
  onAdvance,
  isActive,
  totalWords,
  currentIndex,
}: {
  onAdvance: () => void
  isActive: boolean
  totalWords: number
  currentIndex: number
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(150)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onAdvanceRef = useRef(onAdvance)
  onAdvanceRef.current = onAdvance

  const msPerWord = Math.round(60000 / wpm)

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const startPlayback = useCallback(() => {
    if (!isActive) return
    setIsPlaying(true)
  }, [isActive])

  // Stop when session ends
  useEffect(() => {
    if (!isActive || currentIndex >= totalWords) {
      stopPlayback()
    }
  }, [isActive, currentIndex, totalWords, stopPlayback])

  // Update interval when WPM changes during playback
  useEffect(() => {
    if (isPlaying && isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        onAdvanceRef.current()
      }, msPerWord)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [msPerWord, isPlaying, isActive])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Play/Pause */}
      <button
        onClick={isPlaying ? stopPlayback : startPlayback}
        disabled={!isActive}
        className="w-16 h-16 rounded-full bg-accent hover:bg-accent-dim text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-7 h-7" />
        ) : (
          <Play className="w-7 h-7 ml-1" />
        )}
      </button>

      {/* Speed control */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWpm((w) => Math.max(50, w - 25))}
          aria-label="Decrease speed"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-sm font-mono text-text-secondary w-20 text-center">
          {wpm} WPM
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWpm((w) => Math.min(400, w + 25))}
          aria-label="Increase speed"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-text-muted">
        {isPlaying ? 'Read along with the highlighted words' : 'Press play to start karaoke mode'}
      </p>
    </div>
  )
}
