import { useParams, useNavigate } from 'react-router'
import { useState, useMemo } from 'react'
import { Button } from '@ssc/ui'
import { Badge } from '@ssc/ui'
import { ArrowLeft, Mic, Keyboard, PlayCircle, RotateCcw } from 'lucide-react'
import { SEED_TEXTS } from '~/lib/texts'
import { getCustomTexts } from '~/lib/storage'
import {
  usePracticeSession,
  type PracticeMode,
} from '~/hooks/use-practice-session'
import { WordDisplay } from '~/components/word-display'
import { StatsBar } from '~/components/stats-bar'
import { SpeechMode } from '~/components/practice/speech-mode'
import { TypingMode } from '~/components/practice/typing-mode'
import { KaraokeMode } from '~/components/practice/karaoke-mode'

const MODE_CONFIG = {
  speech: { label: 'Speech', icon: Mic },
  typing: { label: 'Typing', icon: Keyboard },
  karaoke: { label: 'Karaoke', icon: PlayCircle },
} as const

export default function Practice() {
  const { textId } = useParams<{ textId: string }>()
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('speech')

  const text = useMemo(() => {
    const all = [...SEED_TEXTS, ...getCustomTexts()]
    return all.find((t) => t.id === textId)
  }, [textId])

  const {
    session,
    accuracy,
    progress,
    wpm,
    startSession,
    matchWord,
    matchTypedWord,
    skipWord,
    advanceKaraoke,
    resetSession,
  } = usePracticeSession(textId ?? '', text?.title ?? '')

  if (!text) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-text-secondary mb-4">Text not found.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
          Back to texts
        </Button>
      </div>
    )
  }

  function handleStart(mode: PracticeMode) {
    if (!text) return
    setSelectedMode(mode)
    startSession(text.content, mode)
  }

  function handleReset() {
    resetSession()
  }

  const currentWord =
    session.isActive && session.currentIndex < session.words.length
      ? session.words[session.currentIndex].word
      : ''

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to text selection" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{text.title}</h1>
          <p className="text-xs text-text-muted">
            {text.content.split(/\s+/).length} words
          </p>
        </div>
        {session.isActive && (
          <Badge variant="success" dot>
            {MODE_CONFIG[session.mode].label}
          </Badge>
        )}
      </div>

      {/* Pre-session: mode selection */}
      {!session.isActive && !session.isComplete && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-subtle border border-border text-sm text-text-secondary leading-relaxed">
            {text.content}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-text-secondary">
              Choose practice mode:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(MODE_CONFIG) as [PracticeMode, typeof MODE_CONFIG.speech][]).map(
                ([mode, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={mode}
                      onClick={() => handleStart(mode)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-bg-subtle hover:border-accent hover:bg-accent-muted transition-all"
                    >
                      <Icon className="w-6 h-6 text-accent" />
                      <span className="text-sm font-medium">
                        {config.label}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active session */}
      {session.isActive && (
        <>
          <StatsBar
            progress={progress}
            accuracy={accuracy}
            wpm={wpm}
            elapsedMs={session.elapsedMs}
            wordsCompleted={session.currentIndex}
            totalWords={session.words.length}
          />

          <WordDisplay words={session.words} />

          <div className="border-t border-border pt-4">
            {session.mode === 'speech' && (
              <SpeechMode
                onWords={matchWord}
                onSkip={skipWord}
                isActive={session.isActive}
              />
            )}
            {session.mode === 'typing' && (
              <TypingMode
                currentWord={currentWord}
                onSubmit={matchTypedWord}
                onSkip={skipWord}
                isActive={session.isActive}
              />
            )}
            {session.mode === 'karaoke' && (
              <KaraokeMode
                onAdvance={advanceKaraoke}
                isActive={session.isActive}
                totalWords={session.words.length}
                currentIndex={session.currentIndex}
              />
            )}
          </div>
        </>
      )}

      {/* Session complete */}
      {session.isComplete && (
        <div className="text-center space-y-4 py-6">
          <div className="text-4xl mb-2">
            {accuracy >= 90 ? '!!' : accuracy >= 70 ? '!' : ''}
          </div>
          <h2 className="text-xl font-bold">Session Complete</h2>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="p-3 rounded-lg bg-bg-subtle border border-border">
              <p className="text-2xl font-bold text-accent">{accuracy}%</p>
              <p className="text-xs text-text-muted">Accuracy</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-subtle border border-border">
              <p className="text-2xl font-bold text-accent">{wpm}</p>
              <p className="text-xs text-text-muted">WPM</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-subtle border border-border">
              <p className="text-2xl font-bold text-accent">
                {Math.floor(session.elapsedMs / 1000)}s
              </p>
              <p className="text-xs text-text-muted">Time</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Button onClick={() => navigate('/')}>Choose Another</Button>
          </div>
        </div>
      )}
    </div>
  )
}
