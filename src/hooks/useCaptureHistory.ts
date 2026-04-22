import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CaptureRecord } from "../components/types";

export function useCaptureHistory(windowLabel: string, isConfigured: boolean) {
  const [history, setHistory] = useState<CaptureRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedCapturePath, setSelectedCapturePath] = useState("");

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

  const openCapturePreview = (imagePath: string) => {
    setHistoryError("");
    setSelectedCapturePath(imagePath);
  };

  const closeCapturePreview = () => {
    setSelectedCapturePath("");
  };

  return {
    history,
    isHistoryLoading,
    historyError,
    selectedCapturePath,
    loadCaptureHistory,
    handleDeleteHistoryItem,
    openCapturePreview,
    closeCapturePreview,
  };
}
