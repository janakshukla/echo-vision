import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { logWarn } from "../utils/logger";

export type ImagePreviewModalProps = {
  imagePath: string;
  onClose: () => void;
};

export function ImagePreviewModal({ imagePath, onClose }: ImagePreviewModalProps) {
  const [imageSrc, setImageSrc] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadPreview = async () => {
      setImageSrc("");
      setLoadError("");

      try {
        const base64 = await invoke<string>("read_capture_image", { imagePath });
        if (!isActive) return;
        setImageSrc(`data:image/png;base64,${base64}`);
      } catch (error) {
        logWarn("Failed to load capture preview", error);
        if (isActive) {
          setLoadError("Could not load preview image.");
        }
      }
    };

    loadPreview().catch((error) => {
      logWarn("Unexpected preview load error", error);
    });

    return () => {
      isActive = false;
    };
  }, [imagePath]);

  return (
    <div className="fixed inset-0 z-10000 bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Capture Preview</h3>
            <p className="text-xs text-slate-500 break-all">{imagePath}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2 rounded-md"
          >
            Close
          </button>
        </div>

        <div className="bg-slate-900 flex items-center justify-center p-4 max-h-[80vh] overflow-auto min-h-[30vh]">
          {loadError ? (
            <p className="text-sm text-slate-300">{loadError}</p>
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt="Captured screen preview"
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
            />
          ) : (
            <p className="text-sm text-slate-300">Loading preview...</p>
          )}
        </div>
      </div>
    </div>
  );
}
