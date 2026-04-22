## Plan: Local Capture History with SQLite

This is a strong idea and a good fit for your Tauri app.
Recommended approach: store image files locally on disk and store metadata in SQLite (response text + timestamp + image path). This keeps storage efficient, fast, and fully offline on the user system.

**Subtasks**
1. Subtask 1: Add SQLite dependency and app startup wiring.
Goal: make the backend ready to open and use a local SQLite database.
Deliverables:
- Add SQLite crate/features in [src-tauri/Cargo.toml](src-tauri/Cargo.toml).
- Wire DB initialization at app startup in [src-tauri/src/lib.rs](src-tauri/src/lib.rs).
Done when:
- Tauri backend compiles with SQLite dependency.
- App startup logs show DB init success without crashing.

2. Subtask 2: Create backend DB module and schema.
Goal: create a dedicated persistence layer for capture history.
Deliverables:
- Add a DB module under src-tauri/src.
- Define schema with id, image_path, response_text, created_at.
- Ensure table creation runs safely on every startup.
Done when:
- First app launch creates DB file and table automatically.
- Re-launch does not recreate or break existing data.

3. Subtask 3: Implement save capture command.
Goal: persist each successful capture in local storage.
Deliverables:
- Add command to accept image base64 and response text.
- Decode base64 image and save PNG into app data captures folder.
- Insert record in SQLite with file path, response text, timestamp.
Done when:
- Command returns success with created record id.
- Saved image file exists and DB row is present.

4. Subtask 4: Implement list and delete commands.
Goal: support reading and manual cleanup of history entries.
Deliverables:
- Add list command returning records in newest-first order.
- Add delete command removing record (and image file).
Done when:
- List returns persisted items after app restart.
- Delete removes both DB row and corresponding image.

5. Subtask 5: Integrate save flow into frontend capture pipeline.
Goal: store history automatically after AI response is generated.
Deliverables:
- In [src/App.tsx](src/App.tsx), call save command after response generation.
- Keep speech and current UX unchanged if save fails.
Done when:
- New captures are persisted without blocking normal response flow.

6. Subtask 6: Build history UI panel.
Goal: let users view and manage previous captures.
Deliverables:
- In [src/App.tsx](src/App.tsx), add history list with timestamp + response preview.
- Add actions to open image and delete item.
- In [src/App.css](src/App.css), style panel to match current app.
Done when:
- History shows existing saved records on load.
- Open and delete actions work from the UI.

7. Subtask 7: Add resilience and user feedback.
Goal: ensure persistence errors never break capture experience.
Deliverables:
- Guard against empty image/response before saving.
- Show non-blocking message on persistence failure.
Done when:
- Capture and AI response still work even if DB write fails.

8. Subtask 8: Verify end-to-end behavior.
Goal: confirm functional correctness and persistence durability.
Deliverables:
- Run capture flow 3 times and verify 3 history entries.
- Restart app and verify history remains.
- Delete one entry and verify UI + DB + file cleanup.
- Run frontend and backend build checks.
Done when:
- All verification checks pass without regressions.

**Relevant files**
- [src-tauri/Cargo.toml](src-tauri/Cargo.toml): add SQLite crate/features.
- [src-tauri/src/lib.rs](src-tauri/src/lib.rs): initialize DB, register/save/list/delete commands.
- [src/App.tsx](src/App.tsx): invoke persistence after response, render history.
- [src/App.css](src/App.css): history panel styling.

**Verification**
1. Capture 3 screenshots and confirm 3 records appear in history with correct response/timestamp.
2. Restart app and confirm records still exist.
3. Open history entries and verify image files render correctly.
4. Delete one entry and confirm it disappears from UI and DB.
5. Run normal frontend and Tauri build checks to confirm no regressions.

**Decisions captured from your choices**
- Storage model: image files on disk + SQLite metadata.
- Save fields: captured image, AI response text, timestamp.
- Retention: no auto-delete; manual cleanup only.

If you approve, the next handoff can implement this plan exactly.