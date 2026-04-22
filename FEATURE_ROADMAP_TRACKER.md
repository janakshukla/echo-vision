# Feature Roadmap Tracker

Tracks progress for search filters, Gemini fallback OCR summary, shortcut customization, and robustness.

## Status Legend
- [x] Done
- [ ] Pending
- [~] In progress

## Checklist

| # | Subtask | Status | Your Verification | Notes |
|---|---|---|---|---|
| A | Error/logging baseline and console cleanup | [x] Done | [ ] Verified | Added centralized logger with leveled + throttled warnings; replaced noisy console calls in App/hooks/overlay/preview; backend check passed (CHECK_OK), frontend build verification was skipped |
| B | In-app shortcut customization and persistence | [ ] Pending | [ ] Verified | Replace hardcoded shortcut with settings-driven value |
| C | DB updates for searchable history flags/indexes | [ ] Pending | [ ] Verified | Add contains_error/contains_code and indexes |
| D | Backend filtered history query command | [ ] Pending | [ ] Verified | Keyword/date/error/code filters with pagination |
| E | Frontend search and filters in history panel | [ ] Pending | [ ] Verified | Inputs, toggles, reset, paginated results |
| F | Local OCR extraction command | [ ] Pending | [ ] Verified | Extract text from capture image when needed |
| G | Rule-based fallback summarizer integration | [ ] Pending | [ ] Verified | Gemini fail -> OCR summary fallback path |
| H | Response source metadata and UI badges | [ ] Pending | [ ] Verified | Show gemini vs fallback_ocr in history |
| I | Robustness hardening pass | [ ] Pending | [ ] Verified | Retry/timeout guards, safer lifecycle handling |
| J | End-to-end verification and build checks | [ ] Pending | [ ] Verified | Manual scenario tests + frontend/backend compile |

## Manual Verification Guide

1. Create at least 5 captures and confirm history is stored.
2. Search with keyword and confirm expected matches.
3. Filter by date range and confirm correct subset.
4. Toggle contains error/code and verify filtering behavior.
5. Simulate Gemini failure and verify fallback OCR summary is shown.
6. Change shortcut in settings, restart app, verify persistence and trigger.
7. Confirm console output is significantly cleaner in normal use.
8. Run frontend and backend build checks successfully.

## Update Rule

When a subtask is completed and validated:
1. Change Status to [x] Done.
2. Change Your Verification to [x] Verified after your test.
3. Add a short note with evidence in Notes.
