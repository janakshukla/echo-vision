# Master Prompt Editor Feature Tracker

This file tracks implementation progress for the Master Prompt Editor with AI Suggestions feature.

## Status Legend
- [x] Done
- [ ] Pending
- [~] In progress

## Feature Overview
Allow users to customize the system prompt sent to Gemini and get AI-powered suggestions for alternative prompts.

## Implementation Checklist

| # | Subtask | Status | Your Verification | Notes |
|---|---|---|---|---|
| 1 | Add Settings UI Component (modal/drawer with edit field) | [x] Done | [ ] Verified | Added SettingsModal.tsx with active prompt preview, editor, save/reset/suggestions controls |
| 2 | Persist Custom Prompt to localStorage | [x] Done | [ ] Verified | Added MASTER_PROMPT_STORAGE_KEY load/save/reset flow in App.tsx |
| 3 | Add backend command for AI prompt suggestions | [x] Done | [ ] Verified | Implemented suggestions via existing frontend Gemini SDK in App.tsx (no extra backend command needed) |
| 4 | Add UI for Prompt Suggestions (modal with list/apply/copy) | [x] Done | [ ] Verified | Added PromptSuggestionsModal.tsx with fetch, apply, copy actions |
| 5 | Integrate Settings access into Main UI (gear icon/button) | [x] Done | [ ] Verified | Added Prompt Settings button in MainScreen header and modal wiring |
| 6 | Update capture flow to use custom prompt | [x] Done | [ ] Verified | handleAnalyze now uses saved master prompt (fallback default) |
| 7 | Add resilience and error handling (try/catch, fallback) | [x] Done | [ ] Verified | Added guarded localStorage operations and non-blocking UI error/success notices |
| 8 | Verify end-to-end (edit → persist → suggest → capture) | [~] In progress | [ ] Verified | Build checks passed: pnpm build OK and cargo check -q CHECK_OK; runtime manual checks pending |

## Verification Steps You Can Use
1. Edit prompt in settings, save, restart app, verify persistence.
2. Click "Get AI Suggestions" and verify 3-5 suggestions appear.
3. Apply a suggestion, save, run a capture, verify new prompt was used.
4. Revert to default and confirm original prompt is restored.
5. Test error scenarios (if possible) and verify graceful fallback.
6. Run `pnpm build` and `cargo check -q` successfully.

## Update Rule
When you verify each subtask:
1. Change Status to [x] Done.
2. Change Your Verification to [x] Verified.
3. Add brief notes or evidence (screenshot description, console output, etc.).
