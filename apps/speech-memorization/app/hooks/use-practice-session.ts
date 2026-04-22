import { useState, useCallback, useRef, useEffect } from 'react'
import { saveSession, type SessionRecord } from '~/lib/storage'

export type PracticeMode = 'speech' | 'typing' | 'karaoke'

export type WordStatus = 'upcoming' | 'current' | 'correct' | 'incorrect' | 'skipped'

export interface WordState {
  word: string
  normalized: string
  status: WordStatus
  attempts: number
}

export interface PracticeSession {
  words: WordState[]
  currentIndex: number
  mode: PracticeMode
  isActive: boolean
  isComplete: boolean
  startTime: number | null
  totalAttempts: number
  correctCount: number
  elapsedMs: number
}

function normalize(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\w']/g, '')
    .replace(/^'+|'+$/g, '')
}

function parseWords(text: string): WordState[] {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((word, i) => ({
      word,
      normalized: normalize(word),
      status: i === 0 ? 'current' : 'upcoming',
      attempts: 0,
    }))
}

export function usePracticeSession(textId: string, textTitle: string) {
  const [session, setSession] = useState<PracticeSession>({
    words: [],
    currentIndex: 0,
    mode: 'speech',
    isActive: false,
    isComplete: false,
    startTime: null,
    totalAttempts: 0,
    correctCount: 0,
    elapsedMs: 0,
  })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startSession = useCallback(
    (text: string, mode: PracticeMode) => {
      const words = parseWords(text)
      if (timerRef.current) clearInterval(timerRef.current)

      const now = Date.now()
      setSession({
        words,
        currentIndex: 0,
        mode,
        isActive: true,
        isComplete: false,
        startTime: now,
        totalAttempts: 0,
        correctCount: 0,
        elapsedMs: 0,
      })

      timerRef.current = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          elapsedMs: Date.now() - now,
        }))
      }, 200)
    },
    []
  )

  const completeSession = useCallback(
    (s: PracticeSession) => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      const record: SessionRecord = {
        id: crypto.randomUUID(),
        textId,
        textTitle,
        mode: s.mode,
        accuracy:
          s.totalAttempts > 0
            ? Math.round((s.correctCount / s.totalAttempts) * 100)
            : 0,
        wordsCompleted: s.correctCount,
        totalWords: s.words.length,
        durationMs: s.elapsedMs,
        completedAt: new Date().toISOString(),
      }
      saveSession(record)

      return { ...s, isActive: false, isComplete: true }
    },
    [textId, textTitle]
  )

  const matchWord = useCallback(
    (spokenWords: string[]) => {
      setSession((prev) => {
        if (!prev.isActive || prev.isComplete) return prev

        let next = { ...prev, words: [...prev.words] }
        let idx = next.currentIndex

        for (const spoken of spokenWords) {
          if (idx >= next.words.length) break

          const normalizedSpoken = normalize(spoken)
          const target = next.words[idx]

          next.totalAttempts++
          next.words[idx] = { ...target, attempts: target.attempts + 1 }

          if (normalizedSpoken === target.normalized) {
            next.words[idx].status = 'correct'
            next.correctCount++
            idx++

            if (idx < next.words.length) {
              next.words[idx] = { ...next.words[idx], status: 'current' }
            }
          } else {
            next.words[idx].status = 'current'
          }
        }

        next.currentIndex = idx

        if (idx >= next.words.length) {
          return completeSession(next)
        }

        return next
      })
    },
    [completeSession]
  )

  const matchTypedWord = useCallback(
    (typed: string) => {
      matchWord([typed])
    },
    [matchWord]
  )

  const skipWord = useCallback(() => {
    setSession((prev) => {
      if (!prev.isActive || prev.isComplete) return prev

      const words = [...prev.words]
      words[prev.currentIndex] = {
        ...words[prev.currentIndex],
        status: 'skipped',
      }

      const nextIdx = prev.currentIndex + 1
      if (nextIdx < words.length) {
        words[nextIdx] = { ...words[nextIdx], status: 'current' }
      }

      const next = { ...prev, words, currentIndex: nextIdx }

      if (nextIdx >= words.length) {
        return completeSession(next)
      }

      return next
    })
  }, [completeSession])

  const advanceKaraoke = useCallback(() => {
    setSession((prev) => {
      if (!prev.isActive || prev.isComplete) return prev

      const words = [...prev.words]
      words[prev.currentIndex] = {
        ...words[prev.currentIndex],
        status: 'correct',
      }

      const nextIdx = prev.currentIndex + 1
      const next = {
        ...prev,
        words,
        currentIndex: nextIdx,
        correctCount: prev.correctCount + 1,
      }

      if (nextIdx < words.length) {
        words[nextIdx] = { ...words[nextIdx], status: 'current' }
      }

      if (nextIdx >= words.length) {
        return completeSession(next)
      }

      return next
    })
  }, [completeSession])

  const resetSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setSession({
      words: [],
      currentIndex: 0,
      mode: 'speech',
      isActive: false,
      isComplete: false,
      startTime: null,
      totalAttempts: 0,
      correctCount: 0,
      elapsedMs: 0,
    })
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const accuracy =
    session.totalAttempts > 0
      ? Math.round((session.correctCount / session.totalAttempts) * 100)
      : 0

  const progress =
    session.words.length > 0
      ? Math.round((session.currentIndex / session.words.length) * 100)
      : 0

  const wpm =
    session.elapsedMs > 0
      ? Math.round((session.correctCount / session.elapsedMs) * 60000)
      : 0

  return {
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
  }
}
