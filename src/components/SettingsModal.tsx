type SettingsModalProps = {
  isOpen: boolean;
  draftPrompt: string;
  activePrompt: string;
  saveMessage: string;
  errorMessage: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onOpenSuggestions: () => void;
  onClose: () => void;
};

export function SettingsModal({
  isOpen,
  draftPrompt,
  activePrompt,
  saveMessage,
  errorMessage,
  onDraftChange,
  onSave,
  onReset,
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
        </div>
      </div>
    </div>
  );
}
