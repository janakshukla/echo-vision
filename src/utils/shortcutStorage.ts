import {
  ANALYZE_SHORTCUT_STORAGE_KEY,
  DEFAULT_ANALYZE_SHORTCUT,
} from "../components/constants";
import { logWarn } from "./logger";

export const normalizeShortcut = (value: string) => value.replace(/\s+/g, "");

export const loadShortcutFromStorage = () => {
  try {
    const stored = localStorage.getItem(ANALYZE_SHORTCUT_STORAGE_KEY);
    const normalized = normalizeShortcut(stored ?? "");
    return normalized || DEFAULT_ANALYZE_SHORTCUT;
  } catch (error) {
    logWarn("Failed to load shortcut from storage; using default", error);
    return DEFAULT_ANALYZE_SHORTCUT;
  }
};

export const saveShortcutToStorage = (shortcut: string) => {
  const normalized = normalizeShortcut(shortcut);
  if (!normalized) {
    throw new Error("Shortcut cannot be empty");
  }

  localStorage.setItem(ANALYZE_SHORTCUT_STORAGE_KEY, normalized);
  return normalized;
};

export const resetShortcutInStorage = () => {
  localStorage.removeItem(ANALYZE_SHORTCUT_STORAGE_KEY);
  return DEFAULT_ANALYZE_SHORTCUT;
};
