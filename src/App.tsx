import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { register, unregister, isRegistered } from "@tauri-apps/plugin-global-shortcut";
import { DEFAULT_ANALYZE_SHORTCUT, DEFAULT_MASTER_PROMPT } from "./components/constants";
import { MainScreen } from "./components/MainScreen";
import { ImagePreviewModal } from "./components/ImagePreviewModal";
import { OverlayUI } from "./components/OverlayUI";
import { PromptSuggestionsModal } from "./components/PromptSuggestionsModal";
import { SettingsModal } from "./components/SettingsModal";
import { SettingsScreen } from "./components/SettingsScreen";
import type { Region } from "./components/types";
import { useCaptureHistory } from "./hooks/useCaptureHistory";
import { useMasterPrompt } from "./hooks/useMasterPrompt";
import { invokeCaptureWithTimeout, speakResponse } from "./utils/analysis";
import { logError, logWarnThrottled } from "./utils/logger";
import {
  loadShortcutFromStorage,
  normalizeShortcut,
  resetShortcutInStorage,
  saveShortcutToStorage,
} from "./utils/shortcutStorage";
import "./App.css";

const PENDING_REGION_KEY = "echovision_pending_region";
const OVERLAY_CLOSE_REQUEST_KEY = "echovision_overlay_close_request";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [windowLabel] = useState(() => getCurrentWindow().label);
  const [persistenceNote, setPersistenceNote] = useState("");
  const [activeShortcut, setActiveShortcut] = useState(DEFAULT_ANALYZE_SHORTCUT);
  const [shortcutDraft, setShortcutDraft] = useState(DEFAULT_ANALYZE_SHORTCUT);
  const [shortcutMessage, setShortcutMessage] = useState("");
  const [shortcutError, setShortcutError] = useState("");
  const {
    history,
    isHistoryLoading,
    historyError,
    selectedCapturePath,
    loadCaptureHistory,
    handleDeleteHistoryItem,
    openCapturePreview,
    closeCapturePreview,
  } = useCaptureHistory(windowLabel, isConfigured);

  const {
    masterPrompt,
    draftPrompt,
    isSettingsOpen,
    settingsError,
    settingsMessage,
    isSuggestionsOpen,
    suggestions,
    suggestionsError,
    isSuggestionsLoading,
    initializeMasterPrompt,
    setDraftPrompt,
    setSettingsError,
    setSettingsMessage,
    openSettings,
    closeSettings,
    savePrompt,
    resetPrompt,
    openSuggestions,
    closeSuggestions,
    fetchSuggestions,
    applySuggestion,
    copySuggestion,
  } = useMasterPrompt(apiKey);

  const handleAnalyze = async (cropX?: number, cropY?: number, cropW?: number, cropH?: number) => {
    try {
      setPersistenceNote("");
      setStatus("Capturing screen...");
      const base64Image = await invokeCaptureWithTimeout({
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
      });

      setStatus("Analyzing with AI...");
      const imagePart = { inlineData: { data: base64Image, mimeType: "image/png" } };
      const genAI = new GoogleGenerativeAI(apiKey || localStorage.getItem("echovision_api_key") || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = masterPrompt?.trim() || DEFAULT_MASTER_PROMPT;

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      setStatus("Done!");
      speakResponse(responseText);

      if (base64Image && responseText.trim()) {
        try {
          await invoke<number>("save_capture_record", {
            imageBase64: base64Image,
            responseText,
          });
          await loadCaptureHistory();
        } catch (saveError) {
          logError("Failed to persist capture", saveError);
          setPersistenceNote("Response generated, but local save failed.");
        }
      }
    } catch (error) {
      logError("Analysis failed", error);
      setStatus("Capture failed or timed out.");
      speakResponse("Sorry, screen capture failed. Please try snipping again.");
    }
  };

  const triggerAnalyze = () => {
    document.getElementById("analyze-full-btn")?.click();
  };

  const handleSaveShortcut = () => {
    try {
      const normalized = saveShortcutToStorage(shortcutDraft);
      setActiveShortcut(normalized);
      setShortcutDraft(normalized);
      setShortcutError("");
      setShortcutMessage("Shortcut saved.");
    } catch (error) {
      logError("Failed to save shortcut", error);
      setShortcutMessage("");
      setShortcutError("Shortcut could not be saved.");
    }
  };

  const handleResetShortcut = () => {
    try {
      const fallback = resetShortcutInStorage();
      setActiveShortcut(fallback);
      setShortcutDraft(fallback);
      setShortcutError("");
      setShortcutMessage("Shortcut reset to default.");
    } catch (error) {
      logError("Failed to reset shortcut", error);
      setShortcutMessage("");
      setShortcutError("Shortcut could not be reset.");
    }
  };

  const startSnipping = async () => {
    localStorage.removeItem(PENDING_REGION_KEY);
    localStorage.removeItem(OVERLAY_CLOSE_REQUEST_KEY);
    setStatus("Snipping mode active...");

    const existing = await WebviewWindow.getByLabel("overlay");
    if (existing) {
      await existing.close();
    }

    const overlay = new WebviewWindow("overlay", {
      url: "index.html",
      fullscreen: true,
      transparent: true,
      decorations: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focus: true,
    });

    overlay.once("tauri://error", (e) => logError("Overlay window error", e));
  };

  useEffect(() => {
    if (windowLabel !== "main") return;

    const savedKey = localStorage.getItem("echovision_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    }
    initializeMasterPrompt();
    const storedShortcut = loadShortcutFromStorage();
    setActiveShortcut(storedShortcut);
    setShortcutDraft(storedShortcut);

    const tryConsumePendingRegion = async () => {
      const serialized = localStorage.getItem(PENDING_REGION_KEY);
      if (!serialized) return;

      localStorage.removeItem(PENDING_REGION_KEY);

      try {
        const region = JSON.parse(serialized) as Region;
        const { x, y, width, height } = region;

        const overlay = await WebviewWindow.getByLabel("overlay");
        if (overlay) {
          await overlay.close().catch((error) => {
            logWarnThrottled("overlay-close-pending", "Overlay close skipped", error);
          });
        }

        if (width > 10 && height > 10) {
          setStatus("Preparing capture...");
          setTimeout(() => {
            handleAnalyze(x, y, width, height);
          }, 120);
        }
      } catch (error) {
        logWarnThrottled("invalid-region", "Invalid pending region payload", error);
      }
    };

    const tryConsumeOverlayCloseRequest = async () => {
      const closeRequest = localStorage.getItem(OVERLAY_CLOSE_REQUEST_KEY);
      if (!closeRequest) return;

      localStorage.removeItem(OVERLAY_CLOSE_REQUEST_KEY);
      const overlay = await WebviewWindow.getByLabel("overlay");
      if (overlay) {
        await overlay.close().catch((error) => {
          logWarnThrottled("overlay-close-request", "Overlay close request failed", error);
        });
      }
      setStatus((prev) => (prev === "Snipping mode active..." ? "Ready" : prev));
    };

    const onFocus = () => {
      tryConsumePendingRegion().catch((error) => {
        logWarnThrottled("consume-region-focus", "Pending region consume failed", error);
      });
      tryConsumeOverlayCloseRequest().catch((error) => {
        logWarnThrottled("consume-close-focus", "Overlay close consume failed", error);
      });
    };

    const regionPoll = window.setInterval(() => {
      tryConsumePendingRegion().catch((error) => {
        logWarnThrottled("consume-region-poll", "Pending region poll failed", error);
      });
      tryConsumeOverlayCloseRequest().catch((error) => {
        logWarnThrottled("consume-close-poll", "Overlay close poll failed", error);
      });
    }, 250);

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(regionPoll);
    };
  }, [windowLabel, apiKey]);

  useEffect(() => {
    if (windowLabel !== "main") return;

    let isMounted = true;
    const normalized = normalizeShortcut(activeShortcut);
    if (!normalized) {
      setShortcutError("Shortcut cannot be empty.");
      return;
    }

    const registerShortcut = async () => {
      try {
        if (await isRegistered(normalized)) {
          await unregister(normalized);
        }
        await register(normalized, triggerAnalyze);
        if (!isMounted) return;
        setShortcutError("");
      } catch (error) {
        logError("Shortcut registration failed", error);
        if (!isMounted) return;
        setShortcutMessage("");
        setShortcutError("Shortcut registration failed. Reverted to default.");

        if (normalized !== DEFAULT_ANALYZE_SHORTCUT) {
          setActiveShortcut(DEFAULT_ANALYZE_SHORTCUT);
          setShortcutDraft(DEFAULT_ANALYZE_SHORTCUT);
          try {
            saveShortcutToStorage(DEFAULT_ANALYZE_SHORTCUT);
          } catch (persistError) {
            logWarnThrottled("shortcut-fallback-persist", "Failed to persist fallback shortcut", persistError);
          }
        }
      }
    };

    registerShortcut();

    return () => {
      isMounted = false;
      unregister(normalized).catch((error) => {
        logWarnThrottled("shortcut-unregister", "Shortcut unregister failed", error);
      });
    };
  }, [windowLabel, activeShortcut]);

  useEffect(() => {
    loadCaptureHistory().catch((error) => {
      logWarnThrottled("history-initial-load", "Initial history load failed", error);
    });
  }, [windowLabel, isConfigured]);

  if (windowLabel === "overlay") {
    return <OverlayUI />;
  }

  if (!isConfigured) {
    return (
      <SettingsScreen
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onContinue={() => {
          localStorage.setItem("echovision_api_key", apiKey);
          setIsConfigured(true);
        }}
      />
    );
  }

  return (
    <>
      <MainScreen
        status={status}
        persistenceNote={persistenceNote}
        history={history}
        isHistoryLoading={isHistoryLoading}
        historyError={historyError}
        onOpenSettings={openSettings}
        onReadFullScreen={() => handleAnalyze()}
        onSnipRegion={startSnipping}
        onRefreshHistory={() => loadCaptureHistory()}
        onOpenCapture={openCapturePreview}
        onDeleteHistoryItem={handleDeleteHistoryItem}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        draftPrompt={draftPrompt}
        activePrompt={masterPrompt}
        saveMessage={settingsMessage}
        errorMessage={settingsError}
        shortcutValue={shortcutDraft}
        shortcutMessage={shortcutMessage}
        shortcutError={shortcutError}
        onDraftChange={(value) => {
          setDraftPrompt(value);
          setSettingsMessage("");
          setSettingsError("");
        }}
        onSave={savePrompt}
        onReset={resetPrompt}
        onShortcutChange={(value) => {
          setShortcutDraft(value);
          setShortcutMessage("");
          setShortcutError("");
        }}
        onSaveShortcut={handleSaveShortcut}
        onResetShortcut={handleResetShortcut}
        onOpenSuggestions={openSuggestions}
        onClose={closeSettings}
      />

      <PromptSuggestionsModal
        isOpen={isSuggestionsOpen}
        isLoading={isSuggestionsLoading}
        suggestions={suggestions}
        errorMessage={suggestionsError}
        onClose={closeSuggestions}
        onFetch={fetchSuggestions}
        onApply={applySuggestion}
        onCopy={copySuggestion}
      />

      {selectedCapturePath && (
        <ImagePreviewModal
          imagePath={selectedCapturePath}
          onClose={closeCapturePreview}
        />
      )}
    </>
  );
}