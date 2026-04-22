## Feature Plan: Master Prompt Editor with AI Suggestions

**Vision:**
Allow users to customize the system prompt sent to Gemini AI for screen analysis, and get AI-powered suggestions for better prompts based on their use case.

**Architecture:**
- Store custom prompt in localStorage (fallback to default if none set).
- Add Settings modal with current prompt display, edit field, save, and reset buttons.
- Add a "Get AI Suggestions" button that calls a new backend command.
- Backend command runs the current/default prompt through Gemini to generate N alternative prompts.
- Display suggestions in a list with copy/apply actions.
- Keep all workflows non-blocking (failures don't break capture flow).

**Default Prompt (Current):**
```
You are a highly efficient screen reader assistant. Briefly describe the most important thing on this screen in 1 sentence only. If there is a clear error message or code block, read the specific problem.
```

---

## Subtasks

### Subtask 1: Add Settings UI Component
**Goal:** Create a modal/drawer for viewing and editing the master prompt.
**Deliverables:**
- New `SettingsModal.tsx` component with:
  - Display current prompt (read-only preview)
  - Text area for editing the prompt
  - Save, Reset to Default, and Close buttons
  - Non-blocking error messages
- Export a constant with the default prompt to `src/components/constants.ts`
- Wire modal into App.tsx state (open/close toggle)
**Done when:**
- Modal opens/closes cleanly
- Edit field shows current prompt
- Save/Reset buttons are clickable

### Subtask 2: Persist Custom Prompt to localStorage
**Goal:** Allow prompt changes to survive app restart.
**Deliverables:**
- Add Save button logic to write prompt to localStorage key `echovision_master_prompt`
- Add Load logic in App.tsx to read localStorage on startup, fallback to default
- Update `handleAnalyze` to use stored prompt instead of hardcoded string
- Add Reset button logic to clear localStorage and restore default
**Done when:**
- Change prompt in settings, restart app, confirm it persists
- Reset clears localStorage and reverts to default

### Subtask 3: Add Backend Command for AI Prompt Suggestions
**Goal:** Generate alternative prompts using Gemini.
**Deliverables:**
- New Tauri command `suggest_prompts(current_prompt: String, api_key: String) -> Vec<String>`
- Uses same Gemini API to generate 3–5 diverse prompt suggestions
- Prompt generation request: "Given this current screen reader prompt: [current_prompt], generate 3-5 alternative prompts that are similarly concise but focus on different aspects (e.g., accessibility, code detection, UI structure). Return only the prompts, one per line, without numbering or extra formatting."
- Handle API errors gracefully (return empty list if Gemini fails)
**Done when:**
- Command compiles and registers in invoke handler
- Calling it returns a Vec with suggestions (or empty if API fails)

### Subtask 4: Add UI for Prompt Suggestions
**Goal:** Display AI suggestions and let users pick one.
**Deliverables:**
- New `PromptSuggestionsModal.tsx` component with:
  - "Get AI Suggestions" button
  - Loading state while fetching
  - List of 3–5 suggestions with copy + apply + dismiss actions
  - Non-blocking error display
- Wire into SettingsModal or as adjacent modal
- Apply action: copy suggestion into edit field and focus it
- Copy action: copy to clipboard and show brief confirmation
**Done when:**
- Button triggers suggestion fetch
- Suggestions display and apply action updates the edit field
- No errors break the UI

### Subtask 5: Integrate Settings Access into Main UI
**Goal:** Make settings easily discoverable.
**Deliverables:**
- Add a "Settings" button or gear icon in the top-right or bottom-right of MainScreen
- Clicking opens the SettingsModal (Subtask 1 + Subtask 2)
- Clicking "Get AI Suggestions" opens the PromptSuggestionsModal (Subtask 4)
- Both modals are non-blocking overlays
**Done when:**
- Settings button is visible and clickable
- Settings modal opens and closes smoothly
- No visual conflicts with history panel

### Subtask 6: Update Capture Flow to Use Custom Prompt
**Goal:** Ensure AI analysis always uses the user's edited prompt.
**Deliverables:**
- Modify `handleAnalyze` in App.tsx to read the prompt from localStorage before each call
- Pass it to the Gemini model configuration
- Verify that a custom prompt change is immediately reflected in the next capture
**Done when:**
- Edit prompt in settings, save, run a capture, and verify the new prompt was used
- Show the prompt being used in console logs

### Subtask 7: Add Resilience and Error Handling
**Goal:** Ensure Settings/Suggestions don't break capture workflow.
**Deliverables:**
- Wrap all Settings I/O in try/catch
- If localStorage read/write fails, silently fallback to default
- If API suggestion call fails, show non-blocking error notice
- If prompt save fails, notify user but keep modal open for retry
**Done when:**
- Simulate localStorage corruption (e.g., quota exceeded) and confirm fallback works
- Simulate API failure and confirm UI shows a message but remains responsive

### Subtask 8: Verify End-to-End
**Goal:** Confirm feature works holistically.
**Deliverables:**
- Edit master prompt in settings, save, restart app, confirm it persists
- Get AI suggestions, pick one, apply, save, run capture
- Verify capture uses the new prompt and works seamlessly
- Run build checks (pnpm build, cargo check)
**Done when:**
- All verification steps pass
- No warnings or errors in build output

---

## Relevant Files (After Implementation)

- `src/components/constants.ts` — default prompt + other constants
- `src/components/SettingsModal.tsx` — settings UI
- `src/components/PromptSuggestionsModal.tsx` — suggestion UI
- `src/App.tsx` — integrate settings button, wire prompt into analyze flow
- `src-tauri/src/lib.rs` — add `suggest_prompts` command
- `src/App.css` — style modals and settings button

---

## Decisions

- **Storage:** localStorage for simplicity (no backend persistence needed; can upgrade to Tauri local storage API later)
- **Suggestions:** Hosted by same Gemini API call; no external service
- **UX:** Non-blocking modals; settings don't interrupt workflow
- **Default prompt:** Remains as-is unless user edits

---

## Next Steps

1. You review and approve this plan
2. Confirm subtask ordering and scope
3. I implement all 8 subtasks in sequence, building + testing as I go
4. You verify the final feature works end-to-end
