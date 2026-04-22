import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { register, unregister, isRegistered } from "@tauri-apps/plugin-global-shortcut";
import { openPath } from "@tauri-apps/plugin-opener";
import { MainScreen } from "./components/MainScreen";
import { OverlayUI } from "./components/OverlayUI";
import { SettingsScreen } from "./components/SettingsScreen";
import type { CaptureRecord, Region } from "./components/types";
import "./App.css";

const PENDING_REGION_KEY = "echovision_pending_region";
const OVERLAY_CLOSE_REQUEST_KEY = "echovision_overlay_close_request";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [windowLabel] = useState(() => getCurrentWindow().label);
  const [persistenceNote, setPersistenceNote] = useState("");
  const [history, setHistory] = useState<CaptureRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const invokeCaptureWithTimeout = (
    region: { x?: number; y?: number; width?: number; height?: number },
    timeoutMs = 8000,
  ) => {
    return Promise.race([
      invoke<string>("capture_screen", region),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Screen capture timed out.")), timeoutMs);
      }),
    ]);
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const loadCaptureHistory = async () => {
    if (windowLabel !== "main" || !isConfigured) return;

    setIsHistoryLoading(true);
    setHistoryError("");

    try {
      const records = await invoke<CaptureRecord[]>("list_capture_records");
      setHistory(records);
    } catch (error) {
      console.error("Failed to load capture history:", error);
      setHistoryError("Could not load history.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (captureId: number) => {
    try {
      await invoke<boolean>("delete_capture_record", { captureId });
      setHistory((prev) => prev.filter((item) => item.id !== captureId));
    } catch (error) {
      console.error("Failed to delete history item:", error);
      setHistoryError("Could not delete history item.");
    }
  };

  const handleOpenCapture = async (imagePath: string) => {
    try {
      await openPath(imagePath);
    } catch (error) {
      console.error("Failed to open capture image:", error);
      setHistoryError("Could not open image file.");
    }
  };

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
      const prompt =
        "You are a highly efficient screen reader assistant. Briefly describe the most important thing on this screen in 1 sentence only. If there is a clear error message or code block, read the specific problem.";

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      setStatus("Done!");
      speak(responseText);

      if (base64Image && responseText.trim()) {
        try {
          await invoke<number>("save_capture_record", {
            imageBase64: base64Image,
            responseText,
          });
          await loadCaptureHistory();
        } catch (saveError) {
          console.error("Failed to persist capture:", saveError);
          setPersistenceNote("Response generated, but local save failed.");
        }
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      setStatus("Capture failed or timed out.");
      speak("Sorry, screen capture failed. Please try snipping again.");
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

    overlay.once("tauri://error", (e) => console.error("Overlay error:", e));
  };

  useEffect(() => {
    if (windowLabel !== "main") return;

    const savedKey = localStorage.getItem("echovision_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    }

    const setupShortcut = async () => {
      try {
        const shortcut = "CommandOrControl+Shift+2";
        if (await isRegistered(shortcut)) await unregister(shortcut);
        await register(shortcut, () => {
          document.getElementById("analyze-full-btn")?.click();
        });
      } catch (error) {
        console.error("Hotkey setup failed:", error);
      }
    };

    setupShortcut();

    const tryConsumePendingRegion = async () => {
      const serialized = localStorage.getItem(PENDING_REGION_KEY);
      if (!serialized) return;

      localStorage.removeItem(PENDING_REGION_KEY);

      try {
        const region = JSON.parse(serialized) as Region;
        const { x, y, width, height } = region;

        const overlay = await WebviewWindow.getByLabel("overlay");
        if (overlay) {
          await overlay.close().catch(console.error);
        }

        if (width > 10 && height > 10) {
          setStatus("Preparing capture...");
          setTimeout(() => {
            handleAnalyze(x, y, width, height);
          }, 120);
        }
      } catch (error) {
        console.error("Invalid pending region payload:", error);
      }
    };

    const tryConsumeOverlayCloseRequest = async () => {
      const closeRequest = localStorage.getItem(OVERLAY_CLOSE_REQUEST_KEY);
      if (!closeRequest) return;

      localStorage.removeItem(OVERLAY_CLOSE_REQUEST_KEY);
      const overlay = await WebviewWindow.getByLabel("overlay");
      if (overlay) {
        await overlay.close().catch(console.error);
      }
      setStatus((prev) => (prev === "Snipping mode active..." ? "Ready" : prev));
    };

    const onFocus = () => {
      tryConsumePendingRegion().catch(console.error);
      tryConsumeOverlayCloseRequest().catch(console.error);
    };

    const regionPoll = window.setInterval(() => {
      tryConsumePendingRegion().catch(console.error);
      tryConsumeOverlayCloseRequest().catch(console.error);
    }, 250);

    window.addEventListener("focus", onFocus);

    return () => {
      unregister("CommandOrControl+Shift+2").catch(console.error);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(regionPoll);
    };
  }, [windowLabel, apiKey]);

  useEffect(() => {
    loadCaptureHistory().catch(console.error);
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
    <MainScreen
      status={status}
      persistenceNote={persistenceNote}
      history={history}
      isHistoryLoading={isHistoryLoading}
      historyError={historyError}
      onReadFullScreen={() => handleAnalyze()}
      onSnipRegion={startSnipping}
      onRefreshHistory={() => loadCaptureHistory()}
      onOpenCapture={handleOpenCapture}
      onDeleteHistoryItem={handleDeleteHistoryItem}
    />
  );
}