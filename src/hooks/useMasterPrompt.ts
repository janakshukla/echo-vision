import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_MASTER_PROMPT } from "../components/constants";
import {
  loadMasterPromptFromStorage,
  parsePromptSuggestions,
  resetMasterPromptInStorage,
  saveMasterPromptToStorage,
} from "../utils/promptStorage";
import { logError } from "../utils/logger";

export function useMasterPrompt(apiKey: string) {
  const [masterPrompt, setMasterPrompt] = useState(DEFAULT_MASTER_PROMPT);
  const [draftPrompt, setDraftPrompt] = useState(DEFAULT_MASTER_PROMPT);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const initializeMasterPrompt = () => {
    const prompt = loadMasterPromptFromStorage();
    setMasterPrompt(prompt);
    setDraftPrompt(prompt);
  };

  const openSettings = () => {
    setDraftPrompt(masterPrompt);
    setSettingsError("");
    setSettingsMessage("");
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const savePrompt = () => {
    try {
      const nextPrompt = saveMasterPromptToStorage(draftPrompt);
      setMasterPrompt(nextPrompt);
      setDraftPrompt(nextPrompt);
      setSettingsError("");
      setSettingsMessage("Master prompt saved.");
    } catch (error) {
      logError("Failed to save master prompt", error);
      setSettingsMessage("");
      setSettingsError("Could not save prompt. Please try again.");
    }
  };

  const resetPrompt = () => {
    try {
      const nextPrompt = resetMasterPromptInStorage();
      setMasterPrompt(nextPrompt);
      setDraftPrompt(nextPrompt);
      setSettingsError("");
      setSettingsMessage("Prompt reset to default.");
    } catch (error) {
      logError("Failed to reset prompt", error);
      setSettingsMessage("");
      setSettingsError("Could not reset prompt.");
    }
  };

  const openSuggestions = () => {
    setSuggestionsError("");
    setIsSuggestionsOpen(true);
  };

  const closeSuggestions = () => {
    setIsSuggestionsOpen(false);
  };

  const fetchSuggestions = async () => {
    setSuggestionsError("");
    setIsSuggestionsLoading(true);

    try {
      const activeKey = apiKey || localStorage.getItem("echovision_api_key") || "";
      if (!activeKey.trim()) {
        setSuggestionsError("Gemini API key is required to generate suggestions.");
        return;
      }

      const sourcePrompt = draftPrompt.trim() || masterPrompt || DEFAULT_MASTER_PROMPT;
      const genAI = new GoogleGenerativeAI(activeKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const instruction = [
        "Given this screen reader assistant prompt:",
        sourcePrompt,
        "Generate 5 concise alternatives with different focus (accessibility, code errors, UI structure, and critical alerts).",
        "Return only one prompt per line with no numbering and no markdown.",
      ].join("\n\n");

      const result = await model.generateContent(instruction);
      const parsed = parsePromptSuggestions(result.response.text());

      if (parsed.length === 0) {
        setSuggestionsError("No suggestions were generated. Try again.");
        return;
      }

      setSuggestions(parsed);
    } catch (error) {
      logError("Failed to generate prompt suggestions", error);
      setSuggestionsError("Could not generate suggestions right now.");
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setDraftPrompt(suggestion);
    setSettingsMessage("Suggestion applied to editor.");
    setSuggestionsError("");
    setIsSuggestionsOpen(false);
  };

  const copySuggestion = async (suggestion: string) => {
    try {
      await navigator.clipboard.writeText(suggestion);
      setSettingsMessage("Suggestion copied to clipboard.");
    } catch (error) {
      logError("Failed to copy suggestion", error);
      setSuggestionsError("Could not copy to clipboard.");
    }
  };

  return {
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
  };
}
