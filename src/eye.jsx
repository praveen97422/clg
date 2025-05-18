import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as camUtils from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const EyeCursorGlobal = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const lastElementRef = useRef(null); // For TTS tracking
  const [blinking, setBlinking] = useState(false);
  const lastYRef = useRef(null);
  const scrollCooldownRef = useRef(Date.now());
  const blinkingCooldownRef = useRef(Date.now());
  const lastBlinkStateRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = 300;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(results.image, 0, 0, width, height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        drawConnectors(ctx, landmarks, FaceMesh.FACEMESH_TESSELATION, { color: '#C0C0C070' });
        drawLandmarks(ctx, landmarks, { color: '#FF3030', lineWidth: 1 });

        const rightIris = landmarks[468];
        const upperEyelid = landmarks[386];
        const lowerEyelid = landmarks[374];

        if (rightIris && upperEyelid && lowerEyelid) {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const sensitivity = 2.0;

          const x = centerX + (centerX - (rightIris.x * window.innerWidth)) * sensitivity;
          const y = centerY + ((rightIris.y * window.innerHeight) - centerY) * sensitivity;

          // Throttle cursor movement (30fps ~ 33ms)
          const now = performance.now();
          if (now - lastUpdateTimeRef.current > 33) {
            cursorPosRef.current = { x, y };
            if (cursorRef.current) {
              cursorRef.current.style.top = `${y - 10}px`;
              cursorRef.current.style.left = `${x - 10}px`;
            }
            lastUpdateTimeRef.current = now;
          }

          const blinkDistance = Math.abs(upperEyelid.y - lowerEyelid.y);
          const currentTime = Date.now();

          if (blinkDistance < 0.015 && !lastBlinkStateRef.current && currentTime - blinkingCooldownRef.current > 700) {
            setBlinking(true);
            blinkingCooldownRef.current = currentTime;
            lastBlinkStateRef.current = true;
            simulateClickAndSpeak(x, y);
          } else if (blinkDistance >= 0.015 && lastBlinkStateRef.current) {
            setBlinking(false);
            lastBlinkStateRef.current = false;
          }

          if (lastYRef.current !== null) {
            const deltaY = y - lastYRef.current;
            if (Math.abs(deltaY) > 30 && currentTime - scrollCooldownRef.current > 300) {
              const scrollAmount = deltaY > 0 ? 200 : -200;
              window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
              scrollCooldownRef.current = currentTime;
            }
          }
          lastYRef.current = y;
        }
      }
    });

    if (video) {
      cameraRef.current = new camUtils.Camera(video, {
        onFrame: async () => {
          await faceMesh.send({ image: video });
        },
        width,
        height,
      });
      cameraRef.current.start();
    }

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
    };
  }, []);

  // 👁 Simulates a click and speaks the element's text content
  const simulateClickAndSpeak = (x, y) => {
    const element = document.elementFromPoint(x, y);
    if (element) {
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Speak only if different element
      if (element !== lastElementRef.current) {
        const text = element.innerText || element.alt || element.getAttribute('aria-label') || 'No text found';
        speakText(text);
        lastElementRef.current = element;
      }
    }
  };

  // 🔊 TTS function using Web Speech API
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.cancel(); // stop any previous
    speechSynthesis.speak(utterance);
  };

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
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 20,
          height: 20,
          backgroundColor: blinking ? 'red' : 'green',
          borderRadius: '50%',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'top 0.03s linear, left 0.03s linear, background-color 0.1s ease',
        }}
      />
    </>
  );
};

export default EyeCursorGlobal;
