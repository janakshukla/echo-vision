# Echo Vision SQLite Progress Tracker

This file tracks what is completed and what is still pending for local capture history with SQLite.

## Status Legend
- [x] Done
- [ ] Pending
- [~] In progress

## Completed
- [x] Initial architecture decision made: store image files on disk and metadata in SQLite.
- [x] Subtasks were defined and split into execution phases.

## Implementation Checklist

| # | Subtask | Status | Your Verification | Notes |
|---|---|---|---|---|
| 1 | Add SQLite dependency and startup wiring in Tauri backend | [x] Done | [ ] Verified | Added rusqlite dependency and startup initialization in src-tauri/Cargo.toml + src-tauri/src/lib.rs |
| 2 | Create DB module and schema (id, image_path, response_text, created_at) | [x] Done | [ ] Verified | Added src-tauri/src/db.rs with captures table creation and wired into startup; cargo check -q passed (CHECK_OK) |
| 3 | Implement save capture command (base64 -> PNG file + DB insert) | [x] Done | [ ] Verified | Added save_capture_record command and db insert helper; writes PNG to app local captures folder and returns row id; cargo check -q passed (CHECK_OK) |
| 4 | Implement list and delete commands | [x] Done | [ ] Verified | Added list_capture_records and delete_capture_record commands; delete removes DB row and image file; cargo check -q passed (CHECK_OK) |
| 5 | Integrate save flow in frontend capture pipeline | [ ] Pending | [ ] Verified | Save after AI response generation |
| 6 | Add history UI panel (list/open/delete) | [ ] Pending | [ ] Verified | UI in src/App.tsx and styles in src/App.css |
| 7 | Add resilience and non-blocking error handling | [ ] Pending | [ ] Verified | Capture flow should continue if save fails |
| 8 | Run end-to-end verification and build checks | [ ] Pending | [ ] Verified | Restart persistence + delete checks + build passes |

## Verification Steps You Can Use
1. Run capture 3 times and confirm 3 history items appear.
2. Restart app and confirm history still appears.
3. Open a saved item and verify image renders.
4. Delete one item and verify it is gone from UI and storage.
5. Confirm frontend and Tauri build commands pass.

## Update Rule
When a subtask is implemented and tested:
1. Change Status to [x] Done.
2. Change Your Verification to [x] Verified after your check.
3. Add short evidence in Notes (for example: command output or screenshot reference).
