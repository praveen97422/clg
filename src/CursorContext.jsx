import React, { createContext, useState, useEffect } from "react";

export const CursorContext = createContext();

export const CursorProvider = ({ children }) => {
  const [selectedCursor, setSelectedCursor] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedCursor") || "hand";
    }
    return "hand";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCursor", selectedCursor);
    }
  }, [selectedCursor]);

  return (
    <CursorContext.Provider value={{ selectedCursor, setSelectedCursor }}>
      {children}
    </CursorContext.Provider>
  );
};
