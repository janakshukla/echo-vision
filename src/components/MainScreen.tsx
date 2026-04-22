import type { CaptureRecord } from "./types";
import { HistoryPanel } from "./HistoryPanel";

type MainScreenProps = {
  status: string;
  persistenceNote: string;
  history: CaptureRecord[];
  isHistoryLoading: boolean;
  historyError: string;
  onOpenSettings: () => void;
  onReadFullScreen: () => void;
  onSnipRegion: () => void;
  onRefreshHistory: () => void;
  onOpenCapture: (imagePath: string) => void;
  onDeleteHistoryItem: (captureId: number) => void;
};

export function MainScreen({
  status,
  persistenceNote,
  history,
  isHistoryLoading,
  historyError,
  onOpenSettings,
  onReadFullScreen,
  onSnipRegion,
  onRefreshHistory,
  onOpenCapture,
  onDeleteHistoryItem,
}: MainScreenProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">EchoVision</h1>
        <button
          type="button"
          onClick={onOpenSettings}
          className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2 rounded-md"
        >
          Prompt Settings
        </button>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          id="analyze-full-btn"
          onClick={onReadFullScreen}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all"
        >
          Read Full Screen (Ctrl+Shift+2)
        </button>

        <button
          onClick={onSnipRegion}
          className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all"
        >
          Snip Region
        </button>
      </div>

      <div className="mt-8 px-6 py-3 bg-white rounded-lg shadow border border-slate-200 w-full max-w-xs text-center">
        <p className="text-slate-600 font-medium text-sm">
          Status: <span className="text-blue-600">{status}</span>
        </p>
        {persistenceNote && <p className="text-slate-600 text-xs mt-2">{persistenceNote}</p>}
      </div>

      <HistoryPanel
        history={history}
        isLoading={isHistoryLoading}
        errorMessage={historyError}
        onRefresh={onRefreshHistory}
        onOpenCapture={onOpenCapture}
        onDeleteHistoryItem={onDeleteHistoryItem}
      />
    </main>
  );
}
