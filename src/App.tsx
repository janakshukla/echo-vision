import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';

const PENDING_REGION_KEY = "echovision_pending_region";
const OVERLAY_CLOSE_REQUEST_KEY = "echovision_overlay_close_request";

type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState("Ready");
const [windowLabel] = useState(() => getCurrentWindow().label);

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

  const handleAnalyze = async (cropX?: number, cropY?: number, cropW?: number, cropH?: number) => {
    try {
      setStatus("Capturing screen...");
      const base64Image = await invokeCaptureWithTimeout({ 
        x: cropX, 
        y: cropY, 
        width: cropW, 
        height: cropH 
      });
      
      setStatus("Analyzing with AI...");
      const imagePart = { inlineData: { data: base64Image, mimeType: "image/png" } };
      const genAI = new GoogleGenerativeAI(apiKey || localStorage.getItem("echovision_api_key") || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = "You are a highly efficient screen reader assistant. Briefly describe the most important thing on this screen in 1 sentence only. If there is a clear error message or code block, read the specific problem.";
      
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      setStatus("Done!");
      speak(responseText);
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

    const existing = await WebviewWindow.getByLabel('overlay');
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
      focus: true, // <-- ADD THIS LINE
    });

    overlay.once("tauri://error", (e) => console.error("Overlay error:", e));
  };

  // Setup listeners only for the MAIN window
  useEffect(() => {
    if (windowLabel !== "main") return;

    const savedKey = localStorage.getItem("echovision_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    }

    const setupShortcut = async () => {
      try {
        const shortcut = 'CommandOrControl+Shift+2';
        if (await isRegistered(shortcut)) await unregister(shortcut);
        await register(shortcut, () => {
          document.getElementById('analyze-full-btn')?.click(); 
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
      unregister('CommandOrControl+Shift+2').catch(console.error);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(regionPoll);
    };
  }, [windowLabel, apiKey]);

  // ==========================================
  // UI: THE TRANSPARENT OVERLAY (Snipping Tool)
  // ==========================================
  if (windowLabel === "overlay") {
    return <OverlayUI />;
  }

  // ==========================================
  // UI: SETTINGS SCREEN
  // ==========================================
  if (!isConfigured) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 text-gray-800">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Welcome to EchoVision</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your Google Gemini API key to get started.</p>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none mb-4"
          />
          <button 
            onClick={() => {
              localStorage.setItem("echovision_api_key", apiKey);
              setIsConfigured(true);
            }}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg"
          >
            Save & Continue
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // UI: MAIN APP SCREEN
  // ==========================================
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">EchoVision</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          id="analyze-full-btn"
          onClick={() => handleAnalyze()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all"
        >
          Read Full Screen (Ctrl+Shift+2)
        </button>

        <button 
          onClick={startSnipping}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all"
        >
          Snip Region
        </button>
      </div>

      <div className="mt-8 px-6 py-3 bg-white rounded-lg shadow border border-gray-200 w-full max-w-xs text-center">
        <p className="text-gray-600 font-medium text-sm">Status: <span className="text-blue-600">{status}</span></p>
      </div>
    </main>
  );
}

// ==========================================
// COMPONENT: OVERLAY DRAWING LOGIC
// ==========================================
function OverlayUI() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });

  const closeOverlay = async () => {
    localStorage.setItem(OVERLAY_CLOSE_REQUEST_KEY, Date.now().toString());

    try {
      const current = getCurrentWindow();
      await current.setAlwaysOnTop(false).catch(console.error);
      await current.hide().catch(console.error);
      await current.close();
    } catch (error) {
      console.error("Failed to close overlay window:", error);
    }
  };

  const finishSelection = async () => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    setIsDrawing(false);

    try {
      const x = Math.round(Math.min(startPosRef.current.x, currentPosRef.current.x));
      const y = Math.round(Math.min(startPosRef.current.y, currentPosRef.current.y));
      const width = Math.round(Math.abs(startPosRef.current.x - currentPosRef.current.x));
      const height = Math.round(Math.abs(startPosRef.current.y - currentPosRef.current.y));

      if (width > 10 && height > 10) {
        const region: Region = { x, y, width, height };
        localStorage.setItem(PENDING_REGION_KEY, JSON.stringify(region));
      }
    } catch (error) {
      console.error("Failed to persist selected region:", error);
    } finally {
      // Small delay gives the event a chance to propagate before window close.
      setTimeout(() => {
        closeOverlay();
      }, 60);
    }
  };

  useEffect(() => {
    getCurrentWindow().setFocus().catch(console.error);
    const focusRetry = setTimeout(() => {
      getCurrentWindow().setFocus().catch(console.error);
    }, 120);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeOverlay();
      }
    };

    const handleGlobalMouseUp = () => {
      finishSelection();
    };

    const handleBlur = () => {
      // Avoid trapping the user under an always-on-top transparent window.
      closeOverlay();
    };

    const failsafeAutoClose = setTimeout(() => {
      closeOverlay();
    }, 15000);

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mouseup", handleGlobalMouseUp, true);
    window.addEventListener("blur", handleBlur);

    return () => {
      clearTimeout(focusRetry);
      clearTimeout(failsafeAutoClose);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mouseup", handleGlobalMouseUp, true);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    currentPosRef.current = { x: e.clientX, y: e.clientY };
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    currentPosRef.current = { x: e.clientX, y: e.clientY };
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const left = Math.min(startPos.x, currentPos.x);
  const top = Math.min(startPos.y, currentPos.y);
  const width = Math.abs(startPos.x - currentPos.x);
  const height = Math.abs(startPos.y - currentPos.y);

  return (
    <div
      className="w-screen h-screen cursor-crosshair fixed inset-0 z-[9999]"
      style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={finishSelection}
      onContextMenu={(e) => {
        e.preventDefault();
        closeOverlay();
      }}
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 py-2 rounded shadow-lg pointer-events-none">
        Drag to select a region. Press <strong>Esc</strong> to cancel.
      </div>

      <button
        type="button"
        onClick={closeOverlay}
        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded"
      >
        Cancel
      </button>

      {isDrawing && (
        <div
          className="absolute border-2 border-purple-500 bg-purple-500/20"
          style={{ left, top, width, height }}
        />
      )}
    </div>
  );
}