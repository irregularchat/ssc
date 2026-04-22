import { useCallback } from 'react'
import { Button } from '@ssc/ui'
import { Mic, MicOff, SkipForward } from 'lucide-react'
import { useSpeechRecognition } from '~/hooks/use-speech-recognition'

export function SpeechMode({
  onWords,
  onSkip,
  isActive,
}: {
  onWords: (words: string[]) => void
  onSkip: () => void
  isActive: boolean
}) {
  const handleResult = useCallback(
    (words: string[]) => {
      if (isActive) onWords(words)
    },
    [isActive, onWords]
  )

  const { isListening, isSupported, interimTranscript, error, start, stop } =
    useSpeechRecognition(handleResult)

  if (!isSupported) {
    return (
      <div className="text-center p-6 space-y-2">
        <p className="text-error font-medium">
          Speech recognition not supported
        </p>
        <p className="text-sm text-text-secondary">
          Try Chrome, Edge, or Safari for speech recognition support.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Record button */}
      <button
        onClick={isListening ? stop : start}
        disabled={!isActive}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? 'bg-error text-white animate-pulse-record'
            : 'bg-bg-elevated border-2 border-border hover:border-accent text-text-secondary hover:text-accent'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? (
          <MicOff className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>

      <p className="text-sm text-text-muted">
        {isListening ? 'Listening... speak the highlighted word' : 'Tap to start speaking'}
      </p>

      {/* Interim transcript */}
      {interimTranscript && (
        <p className="text-sm text-text-secondary italic">
          "{interimTranscript}"
        </p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      {/* Skip button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkip}
        disabled={!isActive}
        className="mt-2"
      >
        <SkipForward className="w-4 h-4" />
        Skip Word
      </Button>
    </div>
  )
}
