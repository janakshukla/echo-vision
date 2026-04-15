import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState("Ready");

// 2. When the app opens, load the key AND register the hotkey!
 useEffect(() => {
    const savedKey = localStorage.getItem("echovision_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    }

const setupShortcut = async () => {
      try {
        const shortcut = 'CommandOrControl+Shift+1';
        
        // 1. Ask Tauri if it's already registered
        const isReg = await isRegistered(shortcut);
        
        // 2. Only unregister if it actually exists
        if (isReg) {
          await unregister(shortcut);
        }
        
        // 3. Now it is safe to register!
        await register(shortcut, () => {
          console.log('Shortcut triggered!');
          document.getElementById('analyze-btn')?.click(); 
        });
        
        console.log("Hotkey registered successfully!");
      } catch (error) {
        console.error("Hotkey registration failed:", error);
      }
    };

    setupShortcut();

    return () => {
      // 3. And here in the cleanup
      unregister('CommandOrControl+Shift+1').catch(console.error);
    };
  }, []);

  // 3. Update the Save function to write to localStorage
  const handleSaveKey = () => {
    if (apiKey.trim().length > 20) { 
      localStorage.setItem("echovision_api_key", apiKey); 
      setIsConfigured(true);
    } else {
      alert("Please enter a valid Gemini API Key.");
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };


  const handleAnalyze = async () => {
    try {
      setStatus("Capturing screen...");
      const base64Image = await invoke<string>("capture_screen");
      
      setStatus("Analyzing with AI...");
      const imagePart = {
        inlineData: { data: base64Image, mimeType: "image/png" },
      };

      // Use the dynamically entered key instead of the .env file!
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = "You are a highly efficient screen reader assistant. Briefly describe the most important thing on this screen in 1 or 2 sentences. If there is a clear error message or code block, read the specific problem.";
      
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      setStatus("Done!");
      speak(responseText);
      
    } catch (error) {
      console.error(error);
      setStatus("Error occurred.");
      speak("Sorry, I encountered an error. Check your API key and internet connection.");
    }
  };

  // --- UI: SETTINGS SCREEN ---
  if (!isConfigured) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-gray-800">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Welcome to EchoVision</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your Google Gemini API key to get started. This stays on your device.</p>
          
          <input 
            type="password" 
            placeholder="AIzaSy..." 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
          />
          
          <button 
            onClick={handleSaveKey}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </main>
    );
  }

  // --- UI: MAIN APP SCREEN ---
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">EchoVision</h1>
      
     <button 
        id="analyze-btn" 
        onClick={handleAnalyze}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
      >
        {/* 4. Update the UI text so you don't forget it! */}
        Analyze Screen (Ctrl+Shift+1)
      </button>

      <div className="mt-8 px-6 py-3 bg-white rounded-lg shadow border border-gray-200">
        <p className="text-gray-600 font-medium">Status: <span className="text-blue-600">{status}</span></p>
      </div>
      
     <button 
        onClick={() => {
          localStorage.removeItem("echovision_api_key"); 
          setApiKey("");
          setIsConfigured(false);
        }}
        className="mt-12 text-sm text-gray-400 hover:text-gray-600 underline"
      >
        Change API Key
      </button>
Why this works:
    </main>
  );
}