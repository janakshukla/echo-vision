import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Region } from "./types";
import { logError, logWarnThrottled } from "../utils/logger";

const PENDING_REGION_KEY = "echovision_pending_region";
const OVERLAY_CLOSE_REQUEST_KEY = "echovision_overlay_close_request";

type OverlayUIProps = {
  onClosed?: () => void;
};

export function OverlayUI({ onClosed }: OverlayUIProps) {
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
      await current.setAlwaysOnTop(false).catch((error) => {
        logWarnThrottled("overlay-on-top", "Overlay always-on-top reset failed", error);
      });
      await current.hide().catch((error) => {
        logWarnThrottled("overlay-hide", "Overlay hide failed", error);
      });
      await current.close();
    } catch (error) {
      logError("Failed to close overlay window", error);
    } finally {
      onClosed?.();
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
      logError("Failed to persist selected region", error);
    } finally {
      setTimeout(() => {
        closeOverlay();
      }, 60);
    }
  };

  useEffect(() => {
    getCurrentWindow().setFocus().catch((error) => {
      logWarnThrottled("overlay-focus", "Overlay focus failed", error);
    });
    const focusRetry = setTimeout(() => {
      getCurrentWindow().setFocus().catch((error) => {
        logWarnThrottled("overlay-focus-retry", "Overlay focus retry failed", error);
      });
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
      className="w-screen h-screen cursor-crosshair fixed inset-0 z-9999"
      style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={finishSelection}
      onContextMenu={(e) => {
        e.preventDefault();
        closeOverlay();
      }}
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white px-4 py-2 rounded shadow-lg pointer-events-none">
        Drag to select a region. Press <strong>Esc</strong> to cancel.
      </div>

      <button
        type="button"
        onClick={closeOverlay}
        className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2 rounded"
      >
        Cancel
      </button>

      {isDrawing && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20"
          style={{ left, top, width, height }}
        />
      )}
    </div>
  );
}
