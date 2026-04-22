type SettingsModalProps = {
  isOpen: boolean;
  draftPrompt: string;
  activePrompt: string;
  saveMessage: string;
  errorMessage: string;
  shortcutValue: string;
  shortcutMessage: string;
  shortcutError: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onShortcutChange: (value: string) => void;
  onSaveShortcut: () => void;
  onResetShortcut: () => void;
  onOpenSuggestions: () => void;
  onClose: () => void;
};

export function SettingsModal({
  isOpen,
  draftPrompt,
  activePrompt,
  saveMessage,
  errorMessage,
  shortcutValue,
  shortcutMessage,
  shortcutError,
  onDraftChange,
  onSave,
  onReset,
  onShortcutChange,
  onSaveShortcut,
  onResetShortcut,
  onOpenSuggestions,
  onClose,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10000 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Master Prompt Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2 rounded-md"
          >
            Close
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Current Active Prompt</p>
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
              {activePrompt}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="master-prompt-editor">
              Edit Prompt
            </label>
            <textarea
              id="master-prompt-editor"
              value={draftPrompt}
              onChange={(e) => onDraftChange(e.target.value)}
              className="mt-1 w-full min-h-45 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-md"
            >
              Save Prompt
            </button>
            <button
              type="button"
              onClick={onReset}
              className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2 rounded-md"
            >
              Reset to Default
            </button>
            <button
              type="button"
              onClick={onOpenSuggestions}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-md"
            >
              Get AI Suggestions
            </button>
          </div>

          {saveMessage && <p className="text-sm text-blue-700">{saveMessage}</p>}
          {errorMessage && <p className="text-sm text-slate-700">{errorMessage}</p>}

          <div className="border-t border-slate-200 pt-4 mt-2">
            <p className="text-sm font-semibold text-slate-700">Analyze Shortcut</p>
            <p className="text-xs text-slate-500 mt-1">Example: CommandOrControl+Shift+2</p>
            <input
              type="text"
              value={shortcutValue}
              onChange={(e) => onShortcutChange(e.target.value)}
              className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSaveShortcut}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-md"
              >
                Save Shortcut
              </button>
              <button
                type="button"
                onClick={onResetShortcut}
                className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2 rounded-md"
              >
                Reset Shortcut
              </button>
            </div>
            {shortcutMessage && <p className="text-sm text-blue-700 mt-2">{shortcutMessage}</p>}
            {shortcutError && <p className="text-sm text-slate-700 mt-2">{shortcutError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
