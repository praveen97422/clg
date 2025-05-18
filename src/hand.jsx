import React, { useEffect, useRef, useState, useContext } from 'react';
import * as camUtils from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { TextToSpeechContext } from './TextToSpeechContext.jsx';

const HandCursorGlobal = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  const { isTtsEnabled } = useContext(TextToSpeechContext);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [clicking, setClicking] = useState(false);

  const clickCooldownRef = useRef(false);
  const lastYRef = useRef(null);
  const scrollCooldownRef = useRef(Date.now());
  const hoveredElementRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const handsRef = useRef(null);

  // Debounced cursor position update
  const updateCursorPos = (x, y) => {
    requestAnimationFrame(() => {
      setCursorPos({ x, y });
    });
  };

  const speakElementText = (element) => {
    if (!element || !isTtsEnabled) return;

    const text = element.innerText || element.textContent || '';
    if (text.trim().length === 0) return;

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const simulateClick = (x, y) => {
    const element = document.elementFromPoint(x, y);
    if (!element) return;

    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    setTimeout(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, 50);
  };

  const handleHover = (x, y) => {
    const element = document.elementFromPoint(x, y);
    if (element !== hoveredElementRef.current) {
      if (hoveredElementRef.current) {
        hoveredElementRef.current.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        window.speechSynthesis.cancel();
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }

      if (element) {
        element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        if (isTtsEnabled) {
          speechTimeoutRef.current = setTimeout(() => speakElementText(element), 300);
        }
      }

      hoveredElementRef.current = element;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const canvasWidth = 250;
    const canvasHeight = 250;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks?.length) {
        const landmarks = results.multiHandLandmarks[0];
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
        drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1 });

        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        const x = window.innerWidth - indexTip.x * window.innerWidth;
        const y = indexTip.y * window.innerHeight;

        updateCursorPos(x, y);
        handleHover(x, y);

        const dx = indexTip.x - thumbTip.x;
        const dy = indexTip.y - thumbTip.y;
        const pinchDistance = Math.sqrt(dx * dx + dy * dy);

        if (pinchDistance < 0.05 && !clicking && !clickCooldownRef.current) {
          setClicking(true);
          clickCooldownRef.current = true;
          simulateClick(x, y);
          setTimeout(() => {
            clickCooldownRef.current = false;
            setClicking(false);
          }, 300);
        } else if (pinchDistance >= 0.05) {
          setClicking(false);
        }

        // Scroll gesture
        if (lastYRef.current !== null) {
          const deltaY = y - lastYRef.current;
          const now = Date.now();
          if (Math.abs(deltaY) > 35 && now - scrollCooldownRef.current > 200) {
            window.scrollBy({ top: deltaY > 0 ? 100 : -100, behavior: 'smooth' });
            scrollCooldownRef.current = now;
          }
        }
        lastYRef.current = y;
      }
    });

    handsRef.current = hands;

    if (video) {
      cameraRef.current = new camUtils.Camera(video, {
        onFrame: async () => await hands.send({ image: video }),
        width: canvasWidth,
        height: canvasHeight,
      });
      cameraRef.current.start();
    }

    return () => {
      cameraRef.current?.stop();
      handsRef.current?.close();
      window.speechSynthesis.cancel();
      clearTimeout(speechTimeoutRef.current);
    };
  }, [isTtsEnabled]);

  return (
    <>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 200,
          height: 150,
          zIndex: 1,
          pointerEvents: 'none',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#000',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: cursorPos.y - 10,
          left: cursorPos.x - 10,
          width: 20,
          height: 20,
          backgroundColor: clicking ? 'red' : 'blue',
          borderRadius: '50%',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default HandCursorGlobal;
