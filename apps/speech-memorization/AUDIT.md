# Speech Memorization App — Team Review

**Date:** 2026-04-22
**Scope:** Full codebase review — security, architecture, code quality, UX/accessibility
**App:** `apps/speech-memorization/` (React Router 7 static SPA, Cloudflare Pages)
**Architecture:** No backend, no database. localStorage for persistence, Web Speech API for microphone.
**Reviewers:** Security auditor, architecture reviewer, UX/accessibility reviewer

---

## Overall Assessment

Clean, well-structured SPA with minimal attack surface. TypeScript strict mode, zero `any` types, no TODO/FIXME/HACK, no console.log leaks. The main issues are accessibility gaps (nested buttons, missing ARIA), two timer/interval leaks, and dead SSR code. Security is solid — no XSS, no secrets, no external API calls.

---

## CRITICAL (Fix Immediately)

### CR-001: Nested interactive elements — button inside button
- **File:** `app/components/text-selector.tsx:87-119`
- **Issue:** The "remove custom text" `<button>` (line 103-109) is nested inside a parent `<button>` (line 88). Invalid HTML. `e.stopPropagation()` only handles click, not keyboard Enter/Space which triggers both.
- **Fix:** Restructure so card click area and delete button are siblings. Use a `<div>` with `role="button"` + `tabIndex={0}` for the card, or separate the delete button outside.

### CR-002: No `<label>` elements on form inputs
- **File:** `app/components/text-selector.tsx:58-70`
- **Issue:** Custom text form has `<input>` and `<textarea>` without `<label>` elements. `placeholder` is not an accessible substitute. Screen readers cannot identify the fields.
- **Fix:** Add `<label>` elements (can be visually hidden with `sr-only` class) or use `aria-label` on each input/textarea.

### CR-003: No landmark regions or skip-to-content link
- **File:** `app/root.tsx`
- **Issue:** No `<main>` landmark, no `<nav>`, no skip-to-content link. Screen reader users have no way to orient themselves.
- **Fix:** Wrap `<Outlet />` in `<main>`, add skip-to-content link at top of `<body>`.

---

## HIGH (Fix This Sprint)

### HI-001: Timer interval leaks on unmount
- **File:** `app/hooks/use-practice-session.ts:78-83`
- **Issue:** `setInterval` in `startSession` has no `useEffect` cleanup. Navigating away mid-session leaks the interval.
- **Fix:** Add `useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])`

### HI-002: Interval leak in karaoke mode
- **File:** `app/components/practice/karaoke-mode.tsx:32-58`
- **Issue:** `startPlayback` creates interval A, then effect creates interval B. Interval A is leaked.
- **Fix:** Let `startPlayback` only set `isPlaying(true)`. Effect owns interval lifecycle.

### HI-003: Dead SSR code — entry.server.tsx
- **File:** `app/entry.server.tsx`
- **Issue:** `ssr: false` in config. `entry.server.tsx`, `isbot`, and `@react-router/node` are dead code.
- **Fix:** Delete `entry.server.tsx`. Remove `isbot` and `@react-router/node` from package.json.

### HI-004: Non-null assertion on `text!`
- **File:** `app/routes/practice.tsx:63`
- **Issue:** `text!.content` — TypeScript can't prove `text` is defined across function boundaries. Refactoring the guard away silently becomes a runtime crash.
- **Fix:** Add runtime check inside `handleStart`: `if (!text) return`

### HI-005: Progress bar has no accessible semantics
- **File:** `app/components/stats-bar.tsx:30-35`
- **Issue:** Progress bar is a purely visual `<div>`. Screen readers cannot perceive progress.
- **Fix:** Add `role="progressbar"`, `aria-valuenow={progress}`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label="Practice progress"`.

### HI-006: Back button has no accessible label
- **File:** `app/routes/practice.tsx:77-79`
- **Issue:** Back button only contains an icon (`<ArrowLeft />`). No text or `aria-label`.
- **Fix:** Add `aria-label="Back to text selection"`.

### HI-007: WordDisplay has no ARIA live region
- **File:** `app/components/word-display.tsx`
- **Issue:** Word status changes (correct/incorrect/skipped) have no `aria-live` announcement for screen readers. Critical for speech mode.
- **Fix:** Add visually hidden `aria-live="polite"` region announcing the current word.

### HI-008: Typing mode hijacks Tab key
- **File:** `app/components/practice/typing-mode.tsx:31-35`
- **Issue:** `e.preventDefault()` on Tab breaks keyboard navigation. Users relying on keyboard-only nav cannot Tab out of the input. Serious accessibility violation.
- **Fix:** Use a different key combo for skip (Ctrl+Enter) or provide only the button. Remove Tab override.

### HI-009: No microphone permission pre-prompt
- **File:** `app/components/practice/speech-mode.tsx`
- **Issue:** Browser permission dialog appears with zero context when mic button tapped. Users may deny without understanding why.
- **Fix:** Show brief explanation before first mic activation.

---

## MEDIUM

### ME-001: No security headers on Cloudflare Pages
- **File:** Missing `public/_headers`
- **Fix:** Create `_headers` with CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy.

### ME-002: `statusClasses` uses `Record<string, string>` — loses type safety
- **File:** `app/components/word-display.tsx:5`
- **Fix:** Use `Record<WordStatus, string>`.

### ME-003: Color-only differentiation for word status
- **Files:** `app/components/word-display.tsx:5-12`, `app/components/stats-bar.tsx:43-50`
- **Fix:** Add secondary indicators (checkmark/x prefix, underlines).

### ME-004: No confirmation before deleting custom text
- **File:** `app/components/text-selector.tsx:38-40`
- **Fix:** Add `window.confirm()` or inline confirmation state.

### ME-005: Delete button too small for touch (< 44px)
- **File:** `app/components/text-selector.tsx:103-109`
- **Fix:** Increase padding to at least `p-2`, ensure 44x44px minimum.

### ME-006: No page title updates per route
- **Files:** `app/routes/practice.tsx`, `app/routes/home.tsx`
- **Fix:** Add `meta` exports with contextual titles.

### ME-007: `normalize()` doesn't handle unicode/accented characters
- **File:** `app/hooks/use-practice-session.ts:28-32`
- **Fix:** Use `\p{L}` with `u` flag or document limitation.

### ME-008: Karaoke accuracy is always 100% — misleading
- **File:** `app/hooks/use-practice-session.ts:190-218`
- **Fix:** Remove accuracy display for karaoke, or label as "completion" not "accuracy".

### ME-009: Wrong word gives no visual feedback
- **File:** `app/hooks/use-practice-session.ts:142`
- **Fix:** Briefly flash `'incorrect'` status, or show the wrong attempt in UI.

---

## LOW

### L-001: No ErrorBoundary on any route
### L-002: Predictable IDs with `Date.now()` — use `crypto.randomUUID()`
### L-003: Dead type `SpeechRecognitionEventMap`
### L-004: `start` callback missing `stop` in dependency array
### L-005: Google Fonts from external CDN — consider self-hosting
### L-006: No `meta description` tag
### L-007: localStorage lacks input size validation (50KB max)
### L-008: Duplicate `@ssc/ui` imports — consolidate
### L-009: `practice.tsx` at 205 lines — extract sub-components
### L-010: Session history saved but never displayed (dead feature)
### L-011: Hardcoded `lang="en-US"` for speech recognition
### L-012: No focus management on route transitions
### L-013: Dark mode only, no light/system preference support

---

## Positive Findings

- **XSS: CLEAN** — No `dangerouslySetInnerHTML`, `innerHTML`, or `eval()`. All JSX auto-escaped.
- **Secrets: CLEAN** — No API keys, tokens, or passwords.
- **Dependencies: CLEAN** — Minimal, well-known packages.
- **TypeScript: STRICT** — `strict: true`, zero `any` types.
- **localStorage: SAFE** — All `JSON.parse` in try/catch. Session history bounded to 50 entries.
- **Web Speech API: CORRECT** — Proper permission handling, transcripts never persisted externally.
- **Code hygiene: EXCELLENT** — No TODO/FIXME/HACK, no console.log, no dead comments.

---

## Summary

| Severity | Count | Top Issues |
|----------|-------|------------|
| CRITICAL | 3 | Nested buttons, missing form labels, no landmarks |
| HIGH | 9 | Timer leaks, dead SSR code, a11y (progress bar, Tab hijack, no aria-live) |
| MEDIUM | 9 | Security headers, color-only states, delete UX, misleading karaoke accuracy |
| LOW | 13 | ErrorBoundary, predictable IDs, font loading, focus management, dead features |
| **Total** | **34** | |

## Recommended Fix Order

1. **CR-001** — Fix nested buttons (invalid HTML, breaks keyboard)
2. **CR-002 + CR-003** — Add form labels + landmarks (accessibility basics)
3. **HI-001 + HI-002** — Timer/interval leaks (actual bugs)
4. **HI-003** — Delete dead entry.server.tsx + unused deps
5. **HI-008** — Remove Tab key hijacking in typing mode
6. **ME-001** — Add security headers (5 min, high impact)
7. **HI-005 + HI-006 + HI-007** — ARIA attributes (progress bar, back button, live region)
8. Everything else is polish.
