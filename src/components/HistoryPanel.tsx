import type { CaptureRecord } from "./types";

type HistoryPanelProps = {
  history: CaptureRecord[];
  isLoading: boolean;
  errorMessage: string;
  onRefresh: () => void;
  onOpenCapture: (imagePath: string) => void;
  onDeleteHistoryItem: (captureId: number) => void;
};

export function HistoryPanel({
  history,
  isLoading,
  errorMessage,
  onRefresh,
  onOpenCapture,
  onDeleteHistoryItem,
}: HistoryPanelProps) {
  return (
    <section className="history-panel mt-6 w-full max-w-2xl bg-white rounded-xl shadow border border-gray-200">
      <div className="history-header px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Capture History</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="history-body p-3">
        {isLoading && <p className="text-sm text-gray-500">Loading history...</p>}
        {!isLoading && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        {!isLoading && !errorMessage && history.length === 0 && (
          <p className="text-sm text-gray-500">No captures saved yet.</p>
        )}

        {!isLoading && !errorMessage && history.length > 0 && (
          <ul className="history-list flex flex-col gap-3">
            {history.map((item) => (
              <li key={item.id} className="history-item border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap wrap-break-word">{item.response_text}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenCapture(item.image_path)}
                    className="history-btn-open text-sm font-medium px-3 py-1.5 rounded-md"
                  >
                    Open Image
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="history-btn-delete text-sm font-medium px-3 py-1.5 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
