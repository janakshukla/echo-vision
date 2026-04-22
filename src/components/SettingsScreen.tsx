type SettingsScreenProps = {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onContinue: () => void;
};

export function SettingsScreen({ apiKey, onApiKeyChange, onContinue }: SettingsScreenProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 text-gray-800">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Welcome to EchoVision</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your Google Gemini API key to get started.</p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none mb-4"
        />
        <button
          onClick={onContinue}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg"
        >
          Save & Continue
        </button>
      </div>
    </main>
  );
}
