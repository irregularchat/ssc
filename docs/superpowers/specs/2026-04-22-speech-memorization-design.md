# Speech Memorization Platform — Phase 1 Design

**Date:** 2026-04-22
**Status:** Approved
**Scope:** Phase 1 — Core practice app (basic features, no backend)

## Summary

A Cloudflare Pages static app for practicing speech memorization with three modes: speech recognition (Web Speech API), typing, and karaoke read-along. Ships with seed texts and supports user-pasted custom texts via localStorage. No backend, no auth, no database.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment target | Cloudflare Pages (static) | Matches monorepo pattern |
| Feature scope | Basic (speech/typing/karaoke) | Enhanced features in phase 2 |
| Text management | Hybrid: seed texts + localStorage custom | No auth needed for phase 1 |
| Backend | None | Web Speech API is browser-native; no API proxy needed |
| Styling | Tailwind v4 + @ssc/ui | Monorepo consistency |
| Framework | React 19 + React Router 7 + Vite | Same as packing-list app |

## Architecture

```
apps/speech-memorization/
├── public/
├── app/
│   ├── routes/
│   │   ├── home.tsx              # Text selection + custom text input
│   │   └── practice.tsx          # Practice session (all 3 modes)
│   ├── components/
│   │   ├── text-selector.tsx     # Seed text cards + custom text textarea
│   │   ├── practice/
│   │   │   ├── speech-mode.tsx   # Web Speech API recording + word matching
│   │   │   ├── typing-mode.tsx   # Keyboard input + character matching
│   │   │   └── karaoke-mode.tsx  # Auto-advancing word highlight
│   │   ├── word-display.tsx      # Highlighted word-by-word text rendering
│   │   └── stats-bar.tsx         # Accuracy, time, progress indicators
│   ├── hooks/
│   │   ├── use-speech-recognition.ts  # Web Speech API wrapper
│   │   └── use-practice-session.ts    # Session state machine
│   ├── lib/
│   │   ├── texts.ts              # Seed texts array
│   │   └── storage.ts            # localStorage helpers for custom texts + history
│   └── root.tsx
├── package.json                  # @ssc/speech-memorization
├── vite.config.ts
├── react-router.config.ts        # ssr: false (static export)
├── tsconfig.json
├── wrangler.toml                 # Pages deployment (static assets)
└── deploy.sh
```

## Data Flow

```
Seed Texts (lib/texts.ts)     ──┐
                                 ├──→ Text Selector ──→ Practice Session
Custom Texts (localStorage)   ──┘          │
                                           ▼
                                ┌─── Mode Switch ───┐
                                │        │          │
                            Speech    Typing    Karaoke
                             Mode      Mode      Mode
                                │        │          │
                                └──→ Word Display ←─┘
                                     (highlights current word)
                                         │
                                         ▼
                                     Stats Bar
                                  (accuracy, time, %)
                                         │
                                         ▼
                                    localStorage
                                (session history)
```

## Practice Modes

### Speech Mode
- Uses browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Continuous recognition with interim results displayed
- Word matching: lowercase + strip punctuation, advance on match
- Large record button, mobile-friendly
- Visual feedback: current word highlighted, matched words marked green

### Typing Mode
- Text input field below the word display
- Word-by-word comparison on space/enter
- Correct words turn green, incorrect turn red with the correct word shown
- Auto-advance to next word after input

### Karaoke Mode
- Auto-advancing word highlight at configurable WPM (default: 150)
- Play/pause/speed controls
- No scoring — purely a read-along aid
- Progress bar shows position in text

## Components

### text-selector.tsx
- Grid of seed text cards (title, preview, difficulty badge)
- "Use Custom Text" textarea with save-to-localStorage
- Previously saved custom texts shown as cards

### word-display.tsx
- Renders text as individual word spans
- States per word: upcoming (default), current (highlighted), correct (green), incorrect (red), skipped (gray)
- Smooth scroll to keep current word visible

### stats-bar.tsx
- Progress: X/Y words (percentage bar)
- Accuracy: correct/total attempts
- Elapsed time
- WPM (words per minute, calculated)

### use-speech-recognition.ts
- Wraps Web Speech API with React state
- Handles: start, stop, interim results, final results, errors
- Browser compatibility: Chrome (`webkitSpeechRecognition`), Edge, Safari
- Falls back to error message on unsupported browsers (Firefox)

### use-practice-session.ts
- State: currentWordIndex, words[], attempts, correctCount, startTime, mode, isActive
- Actions: startSession, matchWord, skipWord, resetSession, switchMode
- Persists completed session summaries to localStorage

## Monorepo Integration

- Package name: `@ssc/speech-memorization`
- Dependencies: `@ssc/ui` (workspace:*), `@ssc/config` (workspace:*)
- Root `deploy.sh` updated with `speech-memorization` case
- Root `package.json` gets `deploy:speech-memorization` script
- `pnpm-workspace.yaml` already covers `apps/*`

## Phase 2 (Future)

- Multi-provider speech recognition (Google Cloud, OpenAI Whisper, Azure)
- Hono Worker API to proxy speech API keys
- D1 database for user accounts, text management, progress tracking
- Phrase-based practice engine
- AI-powered pronunciation feedback
- Streaming recognition
- Session analytics dashboard
