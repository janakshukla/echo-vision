import { invoke } from "@tauri-apps/api/core";

export const invokeCaptureWithTimeout = (
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

export const speakResponse = (text: string) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  window.speechSynthesis.speak(utterance);
};
