import { DEFAULT_MASTER_PROMPT, MASTER_PROMPT_STORAGE_KEY } from "../components/constants";
import { logWarn } from "./logger";

export const loadMasterPromptFromStorage = () => {
  try {
    const savedPrompt = localStorage.getItem(MASTER_PROMPT_STORAGE_KEY);
    return savedPrompt?.trim() ? savedPrompt : DEFAULT_MASTER_PROMPT;
  } catch (error) {
    logWarn("Failed to load master prompt; using default", error);
    return DEFAULT_MASTER_PROMPT;
  }
};

export const saveMasterPromptToStorage = (prompt: string) => {
  const nextPrompt = prompt.trim() || DEFAULT_MASTER_PROMPT;
  localStorage.setItem(MASTER_PROMPT_STORAGE_KEY, nextPrompt);
  return nextPrompt;
};

export const resetMasterPromptInStorage = () => {
  localStorage.removeItem(MASTER_PROMPT_STORAGE_KEY);
  return DEFAULT_MASTER_PROMPT;
};

export const parsePromptSuggestions = (raw: string): string[] => {
  const cleaned = raw
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, "").trim())
    .filter((line) => line.length > 0);

  return Array.from(new Set(cleaned)).slice(0, 5);
};
