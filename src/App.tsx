import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the AI with your key from the .env file
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function App() {
  const [status, setStatus] = useState("Ready");

  const speak = (text: string) => {
    // Stop any current speech so it doesn't talk over itself
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for a better assistant feel
    window.speechSynthesis.speak(utterance);
  };

  const handleAnalyze = async () => {
    try {
      setStatus("Capturing screen...");
      
      // 1. Tell Rust to take the screenshot
      const base64Image = await invoke<string>("capture_screen");
      
      setStatus("Analyzing with AI...");
      
      // 2. Format the image for Gemini
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        },
      };

      // 3. Ask Gemini what it sees
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = "You are a highly efficient screen reader assistant. Briefly describe the most important thing on this screen in 1 or 2 sentences. If there is a clear error message or code block, read the specific problem.";
      
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text()
      
      // 4. Speak the result and update UI
      setStatus("Done!");
      speak(responseText);
      
    } catch (error) {
      console.error(error);
      setStatus("Error occurred.");
      speak("Sorry, I encountered an error analyzing the screen. Please check the console.");
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>EchoVision</h1>
      
      <button 
        onClick={handleAnalyze}
        style={{ padding: '16px 32px', fontSize: '18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
      >
        Analyze Screen
      </button>

      <p style={{ marginTop: '24px', color: '#4b5563', fontSize: '16px', fontWeight: '500' }}>Status: {status}</p>
    </main>
  );
}