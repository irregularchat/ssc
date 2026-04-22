import type { TextItem } from './texts'

const CUSTOM_TEXTS_KEY = 'ssc-speech-custom-texts'
const SESSION_HISTORY_KEY = 'ssc-speech-sessions'

export interface SessionRecord {
  id: string
  textId: string
  textTitle: string
  mode: 'speech' | 'typing' | 'karaoke'
  accuracy: number
  wordsCompleted: number
  totalWords: number
  durationMs: number
  completedAt: string
}

export function getCustomTexts(): TextItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEXTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomText(text: TextItem): void {
  const texts = getCustomTexts()
  texts.push(text)
  localStorage.setItem(CUSTOM_TEXTS_KEY, JSON.stringify(texts))
}

export function removeCustomText(id: string): void {
  const texts = getCustomTexts().filter((t) => t.id !== id)
  localStorage.setItem(CUSTOM_TEXTS_KEY, JSON.stringify(texts))
}

export function getSessionHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSession(session: SessionRecord): void {
  const history = getSessionHistory()
  history.unshift(session)
  // Keep last 50 sessions
  localStorage.setItem(
    SESSION_HISTORY_KEY,
    JSON.stringify(history.slice(0, 50))
  )
}
