import React, { useContext } from "react";
import AppRoutes from "./Routes.jsx";
import Footer from "./footers.jsx";
// import "./App.css"; // Import your global styles here
import PingBackend from "./PingBackend";
import HandCursorGlobal from './hand.jsx';  // Import the HandCursorGlobal component
import EyeCursorGlobal from './eye.jsx';  // Import the EyeCursorGlobal component
import { CursorContext, CursorProvider } from "./CursorContext.jsx";
import { TextToSpeechProvider, TextToSpeechContext } from "./TextToSpeechContext.jsx";

function App() {
  return (
    <CursorProvider>
      <TextToSpeechProvider>
        <AppContent />
      </TextToSpeechProvider>
    </CursorProvider>
  );
}

function AppContent() {
  const { selectedCursor, setSelectedCursor } = useContext(CursorContext);
  const { isTtsEnabled, setIsTtsEnabled } = useContext(TextToSpeechContext);

  return (
    <>
      {/* Initialize PingBackend to check server status */}
      <PingBackend />

      {/* Button to select between Hand, Eye, and None */}
      <div style={{ position: "fixed", top: "70%", right: 10, zIndex: 1000 }}>
        <button
          onClick={() => setSelectedCursor("hand")}
          style={{
            marginRight: 10,
            backgroundColor: selectedCursor === "hand" ? "#007bff" : "#ccc",
            color: selectedCursor === "hand" ? "white" : "black",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Hand
        </button>
        <button
          onClick={() => setSelectedCursor("eye")}
          style={{
            marginRight: 10,
            backgroundColor: selectedCursor === "eye" ? "#007bff" : "#ccc",
            color: selectedCursor === "eye" ? "white" : "black",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Eye
        </button>
        <button
          onClick={() => setSelectedCursor("none")}
          style={{
            backgroundColor: selectedCursor === "none" ? "#007bff" : "#ccc",
            color: selectedCursor === "none" ? "white" : "black",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          None
        </button>
      </div>

      {/* Global Text-to-Speech Toggle Button */}
      <div style={{ position: "fixed", top: "80%", right: 10, zIndex: 1000 }}>
        <button
          onClick={() => setIsTtsEnabled(!isTtsEnabled)}
          style={{
            backgroundColor: isTtsEnabled ? "#28a745" : "#6c757d",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
          aria-label={isTtsEnabled ? "Disable Text to Speech" : "Enable Text to Speech"}
        >
          {isTtsEnabled ? "TTS On" : "TTS Off"}
        </button>
      </div>

      {/* Your app's main routes */}
      <AppRoutes />

      {/* Footer component */}
      <Footer />

      {/* Conditionally render cursor tracking functionality */}
      {selectedCursor === "hand" && <HandCursorGlobal />}
      {selectedCursor === "eye" && <EyeCursorGlobal />}
    </>
  );
}

export default App;
