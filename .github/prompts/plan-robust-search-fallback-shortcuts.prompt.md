## Plan: Search, Offline Fallback, Shortcut Customization, and Robustness

This plan covers the requested features:
1. Search past AI responses by keyword, date, and contains error/code.
2. Gemini failure fallback to local OCR + rule-based summary.
3. In-app shortcut customization.
4. Robustness improvements to reduce noisy console errors.

## Phase 0: Stabilization Baseline

Goal: reduce console noise and establish predictable error handling before adding features.

Deliverables:
- Classify existing logs into debug, warn, and error.
- Introduce shared error formatting helpers for frontend and backend command errors.
- Replace repeated noisy console logs with throttled or conditional logs.
- Add non-blocking user-facing feedback for recoverable errors.

Done when:
- Normal usage no longer floods console.
- Recoverable issues show clear UI feedback without crashing workflows.

## Phase 1: Searchable History

Goal: make capture history useful at scale.

Deliverables:
- Add DB support for filtering:
  - keyword search in response_text
  - date range filtering (from/to)
  - contains_error and contains_code flags
- Add indexes for created_at and text filtering.
- Add backend command to query filtered history with pagination.
- Add frontend filter controls:
  - search input
  - date from/date to
  - contains error toggle
  - contains code toggle
  - reset filters
- Add pagination or load-more handling in history panel.

Done when:
- History can be filtered by all requested criteria.
- Performance remains smooth with larger datasets.

## Phase 2: Gemini Failure Fallback

Goal: app still works when Gemini is unavailable.

Deliverables:
- Add backend OCR command to extract text from saved capture image.
- Add rule-based summarizer on extracted text:
  - detect likely errors
  - detect likely code fragments
  - generate concise one-line fallback summary
- Integrate fallback flow:
  - try Gemini first
  - on failure/timeout, run OCR + rule summary
- Persist response source metadata (gemini or fallback_ocr).
- Show response source badge in UI.

Done when:
- Capture analysis returns meaningful output even if Gemini fails.
- Fallback responses are persisted and visible in history.

## Phase 3: Customizable Shortcuts

Goal: remove hardcoded shortcut and let users configure it safely.

Deliverables:
- Add shortcut settings UI section:
  - current shortcut display
  - editable input
  - save/reset actions
- Persist selected shortcut locally.
- Replace hardcoded registration with dynamic registration from settings.
- Add validation and fallback behavior if invalid/unavailable shortcut is entered.
- Keep previous valid shortcut if registration fails.

Done when:
- User can change shortcut in-app.
- Shortcut survives restart.
- Invalid shortcuts do not break the app.

## Phase 4: Robustness Hardening

Goal: reduce runtime fragility and repeated errors.

Deliverables:
- Centralized async invoke wrappers with consistent error mapping.
- Retry policy only where safe (Gemini: one retry with backoff).
- Guard clauses for empty payloads and missing files.
- Improve overlay/snipping lifecycle cleanup to avoid repeated close errors.
- Add safe fallbacks for clipboard and storage failures.

Done when:
- Repeated failures do not cascade.
- App remains responsive under partial failure conditions.

## Phase 5: Verification

Goal: validate behavior end-to-end.

Deliverables:
- Manual checks:
  1. create multiple captures
  2. filter by keyword/date/error/code
  3. simulate Gemini failure and verify fallback output
  4. change shortcut and verify trigger behavior
  5. verify reduced console noise
- Build checks:
  - frontend build/typecheck
  - backend compile checks

Done when:
- All scenario checks pass without regressions.

## Subtask Breakdown

1. Subtask A: error and logging baseline.
2. Subtask B: shortcut settings + dynamic registration.
3. Subtask C: DB schema updates for search flags/indexes.
4. Subtask D: backend filtered history query command.
5. Subtask E: frontend history search/filter UI.
6. Subtask F: backend OCR extraction command.
7. Subtask G: rule-based fallback summarizer + integration.
8. Subtask H: source badges and metadata in history.
9. Subtask I: robustness hardening pass.
10. Subtask J: end-to-end verification and cleanup.

## Suggested Execution Order

1. Subtask A
2. Subtask B
3. Subtask C + D + E
4. Subtask F + G + H
5. Subtask I
6. Subtask J
