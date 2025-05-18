import React, { useState, useEffect, useRef, useContext } from "react";
import { TextToSpeechContext } from "../TextToSpeechContext.jsx";

const TextToSpeech = ({ text }) => {
  const { isTtsEnabled } = useContext(TextToSpeechContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // If TTS is disabled while speaking, stop speech
    if (!isTtsEnabled && isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, [isTtsEnabled, isPlaying]);

  useEffect(() => {
    // If TTS is enabled and text changes, speak automatically
    if (isTtsEnabled && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
    // Cleanup on text change or disable
    return () => {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    };
  }, [isTtsEnabled, text]);

  return null; // No UI, controlled globally
};

export default TextToSpeech;
