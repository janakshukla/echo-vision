type PromptSuggestionsModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  suggestions: string[];
  errorMessage: string;
  onClose: () => void;
  onFetch: () => void;
  onApply: (suggestion: string) => void;
  onCopy: (suggestion: string) => void;
};

export function PromptSuggestionsModal({
  isOpen,
  isLoading,
  suggestions,
  errorMessage,
  onClose,
  onFetch,
  onApply,
  onCopy,
}: PromptSuggestionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10001 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">AI Prompt Suggestions</h3>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2 rounded-md"
          >
            Close
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 max-h-[75vh] overflow-auto">
          <button
            type="button"
            onClick={onFetch}
            disabled={isLoading}
            className="self-start bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-3 py-2 rounded-md"
          >
            {isLoading ? "Generating..." : "Get AI Suggestions"}
          </button>

          {errorMessage && <p className="text-sm text-slate-700">{errorMessage}</p>}

          {!isLoading && !errorMessage && suggestions.length === 0 && (
            <p className="text-sm text-slate-500">No suggestions yet. Click "Get AI Suggestions".</p>
          )}

          <div className="flex flex-col gap-3">
            {suggestions.map((suggestion, index) => (
              <div key={`${index}-${suggestion.slice(0, 20)}`} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{suggestion}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onApply(suggestion)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopy(suggestion)}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
