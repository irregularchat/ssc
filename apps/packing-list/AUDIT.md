# Community Packing List — Deep Dive Audit

**Date:** 2026-04-22
**Scope:** Full codebase review — security, architecture, database, UX/accessibility
**App:** `apps/packing-list/` (React Router 7 + Cloudflare Workers + D1 + R2)

---

## CRITICAL (Fix Immediately)

### CR-001: Admin password hardcoded in wrangler.toml
- **File:** `wrangler.toml:21`
- **Issue:** `ADMIN_PASSWORD = "cpl-admin-2026"` is committed to git in plaintext. Anyone with repo access has admin.
- **Fix:** Move to Cloudflare secret: `wrangler secret put ADMIN_PASSWORD`. Remove from wrangler.toml.

### CR-002: Auth cookie is forgeable — no secret/signature
- **File:** `app/lib/admin.server.ts:30-36`
- **Issue:** `createAuthCookie()` is just `btoa(JSON.stringify({authenticated: true, timestamp}))`. Anyone can forge this — there's no HMAC, no server secret, no signing. Any user can create a valid admin session by base64-encoding `{"authenticated":true,"timestamp":1234567890}`.
- **Fix:** Use HMAC-SHA256 with a server secret to sign the cookie. Or use Cloudflare's `crypto.subtle.sign()` with a secret stored via `wrangler secret`.

### CR-003: Password comparison is timing-attack vulnerable
- **File:** `app/lib/admin.server.ts:23`
- **Issue:** `password === adminPassword` uses string equality which is vulnerable to timing attacks. An attacker can determine password length character by character.
- **Fix:** Use constant-time comparison: `crypto.subtle.timingSafeEqual()` (available in Workers runtime).

### CR-004: No global error boundary
- **File:** `app/root.tsx`
- **Issue:** No `ErrorBoundary` export. If any loader throws, users see raw React Router error.
- **Fix:** Export an `ErrorBoundary` component from root.tsx with user-friendly messaging and a "Go Home" link.

### CR-005: Prices stored as REAL (float)
- **File:** `db/migrations/0001_initial.sql:58`
- **Issue:** `price REAL NOT NULL` — floating-point arithmetic causes rounding errors ($9.99 + $1.01 ≠ $11.00).
- **Fix:** Migration to change to `INTEGER` (store cents). Update all price display/input code to convert.

### CR-006: Missing ARIA labels on interactive elements
- **File:** `app/components/layout/header.tsx:53-62`, `app/components/layout/bottom-nav.tsx:18-50`
- **Issue:** Icon-only buttons have no `aria-label`. Screen readers announce nothing useful.
- **Fix:** Add `aria-label` to every icon-only button.

---

## HIGH (Fix This Sprint)

### HI-001: Auth cookie missing Secure flag
- **File:** `app/lib/admin.server.ts:97`
- **Issue:** Cookie header is `HttpOnly; SameSite=Lax` but missing `Secure`. Over HTTP (dev), the cookie is sent in plaintext.
- **Fix:** Add `Secure` flag: `HttpOnly; Secure; SameSite=Lax`.

### HI-002: No rate limiting on ANY endpoint
- **Files:** All public routes, `admin.login.tsx`
- **Issue:** Zero rate limiting on login (brute force), voting (unlimited per IP), price/tip submissions (spam), CSV upload (DoS). The `voter_ip` field exists in schema but is never passed or checked — votes are completely undeduplicated.
- **Fix:** Cloudflare Rate Limiting rules for login. KV-backed per-IP dedup for votes. Add `UNIQUE(price_id, voter_ip)` and `UNIQUE(tip_id, voter_ip)` constraints.

### HI-003: No CSRF protection on forms
- **Files:** All route action handlers
- **Issue:** No CSRF tokens anywhere. `SameSite=Lax` partially protects admin (blocks cross-origin POST), but public endpoints (voting, submissions, uploads) are fully vulnerable.
- **Fix:** Add CSRF tokens or validate `Origin`/`Referer` header on all POST handlers.

### HI-NEW: CSV import has no row/size limit
- **Files:** `admin.import-export.tsx:85-248`, `list.upload.tsx:74-119`
- **Issue:** CSV processing loops with individual INSERTs, no row count limit. The public CSV upload at `list.upload.tsx` is **unauthenticated**. Could cause Worker CPU timeout or DB saturation.
- **Fix:** Max 1000 rows (public), 10000 (admin). Use `db.batch()` for bulk inserts.

### HI-NEW2: No input length validation
- **Files:** All action handlers
- **Issue:** User text fields only checked for emptiness, never max length. Attackers could submit megabytes per field.
- **Fix:** Add max length: names 200 chars, descriptions 2000, tip bodies 5000.

### HI-004: db.server.ts is 3,543 lines
- **File:** `app/lib/db.server.ts`
- **Issue:** Single file with all database queries. Impossible to navigate, review, or test in isolation.
- **Fix:** Split into domain files: `stores.server.ts`, `items.server.ts`, `lists.server.ts`, `prices.server.ts`, `tips.server.ts`.

### HI-005: N+1 query patterns
- **File:** `app/lib/db.server.ts` (getPackingList, getShoppingComparison)
- **Issue:** Loads list, then separately loads items for each. Multiple DB roundtrips.
- **Fix:** Use JOINs to fetch related data in single queries.

### HI-006: 41 instances of `any` type
- **Files:** Various route files, db.server.ts
- **Issue:** Type safety gaps — `any` types defeat TypeScript's purpose.
- **Fix:** Define proper interfaces for all data shapes. Key offenders: `db.server.ts:2920,3013` (`row: any`).

### HI-007: No skeleton loading UI
- **Files:** `_index.tsx`, `list.$id.tsx`, `stores.tsx`
- **Issue:** Pages go blank while loaders fetch data. No visual feedback.
- **Fix:** Add `<Suspense fallback={<Skeleton />}>` boundaries or React Router's `useNavigation()` for loading states.

### HI-008: Missing FK constraints and ON DELETE actions
- **File:** `db/migrations/0001_initial.sql`
- **Issue:** `packing_lists.school_id`, `prices.item_id`, `prices.store_id` lack `ON DELETE CASCADE/SET NULL`. Deleting a school orphans lists.
- **Fix:** Add proper FK constraints in new migration.

### HI-009: No pagination on list queries
- **File:** `app/lib/db.server.ts:100,120`
- **Issue:** `getItems()` and `getStores()` return all rows unbounded. Will degrade as data grows.
- **Fix:** Add `LIMIT/OFFSET` pagination with cursor-based option for large sets.

### HI-010: Required form fields not visually marked
- **Files:** `list.create.tsx:76`, `list.$id.add-item.tsx:267`, `prices.$itemId.add.tsx:130`
- **Issue:** Fields have `required` HTML attribute but no visual `*` indicator.
- **Fix:** Add `*` or `(required)` to label text with `aria-label="required"`.

### HI-011: No R2 upload validation
- **Issue:** No file type checking, size limits, or content validation on R2 uploads. Users could upload arbitrary files.
- **Fix:** Validate MIME type, enforce max size (e.g., 5MB), and check file extension on upload.

### HI-012: Missing alt text on images
- **File:** `list.$id.tsx:146`, `prices.$itemId.add.tsx:112`
- **Issue:** Item thumbnails have `alt=""` — empty alt text.
- **Fix:** Use `alt={item.name}`.

---

## MEDIUM (Fix Next Sprint)

### ME-001: 15 bare `console.error` catch blocks
- **Files:** 14 admin routes + `admin.server.ts`
- **Issue:** Errors logged but no user feedback. Users see nothing when an action fails silently.
- **Fix:** Return error state from actions: `return { error: "Failed to save" }`.

### ME-002: No React error boundaries on routes
- **Files:** `list.$id.tsx`, `prices.$itemId.tsx`
- **Issue:** Routes throw 404 responses but have no `ErrorBoundary` exports. Errors show unstyled.
- **Fix:** Export `ErrorBoundary` from routes that throw.

### ME-003: Missing indexes on frequently queried columns
- **Issue:** No index on `items.asin`, `stores.city`, `prices.item_id`.
- **Fix:** Add migration with `CREATE INDEX` statements.

### ME-004: No keyboard navigation on custom dropdowns
- **File:** `app/components/layout/header.tsx:52-129`
- **Issue:** Location selector dropdown doesn't respond to arrow keys, Enter, Escape.
- **Fix:** Add `onKeyDown` handler with standard dropdown keyboard patterns.

### ME-005: Missing `aria-live` for dynamic content
- **File:** `prices.$itemId.tsx:53-87`
- **Issue:** Vote counts update with no screen reader announcement.
- **Fix:** Wrap in `<div aria-live="polite">`.

### ME-006: Color-only status indicators
- **File:** `_index.tsx:370-375`
- **Issue:** Badges rely solely on color (green/red). Colorblind users can't distinguish.
- **Fix:** Include text or icons alongside color.

### ME-007: Destructive migrations without backup
- **File:** `db/migrations/0003_fix_base_names_2025.sql`
- **Issue:** UPDATE statements without prior data backup.
- **Fix:** Add backup pattern: create temp table, copy data, then alter.

### ME-008: No `prefers-reduced-motion` support
- **File:** `_index.tsx:121-124`
- **Issue:** Staggered animations ignore user motion preferences.
- **Fix:** Check `prefers-reduced-motion` media query and skip delays.

### ME-009: Search input missing label
- **File:** `_index.tsx:389-399`
- **Issue:** Search input has placeholder but no `aria-label`.
- **Fix:** Add `aria-label="Search packing lists and items"`.

### ME-010: No orphaned R2 file cleanup
- **Issue:** No tracking table for uploaded files. Deleted items leave orphaned R2 objects.
- **Fix:** Add `uploads` table with FK references. Run cleanup job.

---

## LOW (Tech Debt)

### LO-001: admin.stores._index.tsx at 671 lines
- Could be split into smaller components.

### LO-002: Inconsistent seed data casing
- `db/seed.sql` mixes 'LIBERTY' vs 'Liberty'.

### LO-003: Missing meta descriptions on some routes
- `list.$id.tsx`, `prices.$itemId.tsx` have titles but no description.

### LO-004: Custom radio buttons missing focus ring
- `prices.$itemId.add.tsx:145-178`

### LO-005: DATE columns as TEXT
- `created_at` / `updated_at` are TEXT. This is fine for D1/SQLite but add CHECK constraints for ISO 8601 format.

---

## Summary

| Severity | Count | Top Issues |
|----------|-------|------------|
| **CRITICAL** | 6 | Hardcoded password, forgeable auth cookie, no error boundary, float prices |
| **HIGH** | 14 | No rate limiting, no CSRF, CSV no limits, input length, 3.5K db file, N+1 queries |
| **MEDIUM** | 10 | Silent error handling, missing indexes, keyboard a11y, color-only indicators |
| **LOW** | 5 | Large files, inconsistent data, missing meta tags |
| **Total** | **35** | |

## Positive Findings

- **SQL injection: WELL PROTECTED** — All 3,543 lines of db.server.ts use parameterized queries. Dynamic `IN (...)` uses `ids.map(() => '?').join(',')` correctly. Sort columns validated against allowlists.
- **XSS: WELL PROTECTED** — No `dangerouslySetInnerHTML` anywhere. React JSX escaping handles all user content.
- **R2 bucket: NOT USED** — Configured but no put/get operations exist. No file upload vulnerability.
- **Admin route protection: CORRECTLY STRUCTURED** — `admin.tsx` layout runs `requireAdmin()` before all child routes.

## Recommended Fix Order

1. **CR-001 + CR-002 + CR-003** — Auth is broken. Fix the password secret, cookie signing, and timing attack in one PR.
2. **CR-004** — Add error boundary (5 min fix, huge UX impact).
3. **CR-005** — Price storage migration (data integrity).
4. **HI-004** — Split db.server.ts (unblocks everything else).
5. **HI-008 + HI-009 + ME-003** — Database constraints, pagination, indexes (one migration PR).
6. **HI-007 + HI-010** — Loading states and form UX.
7. **CR-006 + HI-012 + ME-004-009** — Accessibility pass.
