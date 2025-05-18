import React, { createContext, useState, useEffect } from "react";

export const TextToSpeechContext = createContext();

export const TextToSpeechProvider = ({ children }) => {
  const [isTtsEnabled, setIsTtsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("isTtsEnabled");
      return saved === null ? false : JSON.parse(saved);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isTtsEnabled", JSON.stringify(isTtsEnabled));
    }
  }, [isTtsEnabled]);

  return (
    <TextToSpeechContext.Provider value={{ isTtsEnabled, setIsTtsEnabled }}>
      {children}
    </TextToSpeechContext.Provider>
  );
};
