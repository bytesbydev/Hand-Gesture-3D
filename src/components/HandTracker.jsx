/**
 * HandTracker Component - Air Drawing System
 * Uses MediaPipe Hands for real-time hand detection
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const HandTracker = ({ onHandsDetected, videoWidth = 640, videoHeight = 480 }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Process landmarks
   */
  const processLandmarks = useCallback((landmarks) => {
    if (!landmarks) return null;

    return landmarks.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z || 0,
      visibility: lm.visibility || 1,
    }));
  }, []);

  /**
   * Draw hand with neon effects
   */
  const drawNeonHand = (ctx, landmarks, color) => {
    if (!landmarks || landmarks.length === 0) return;

    const scale = { x: canvasRef.current.width, y: canvasRef.current.height };

    // Colors for neon glow effect
    const colors = [
      '#00ffff', // cyan
      '#00ff88', // lime green
      '#ffaa00', // orange
      '#ff00ff', // magenta
      '#00ffff', // back to cyan
    ];

    // Finger connections
    const connections = [
      [0, 1, 2, 3, 4],        // thumb
      [0, 5, 6, 7, 8],        // index
      [0, 9, 10, 11, 12],     // middle
      [0, 13, 14, 15, 16],    // ring
      [0, 17, 18, 19, 20],    // pinky
    ];

    // Draw fingers with glow
    connections.forEach((finger, fingerIdx) => {
      const glowColor = colors[fingerIdx % colors.length];
      
      for (let i = 0; i < finger.length - 1; i++) {
        const from = landmarks[finger[i]];
        const to = landmarks[finger[i + 1]];

        if (!from || !to) continue;

        const x1 = from.x * scale.x;
        const y1 = from.y * scale.y;
        const x2 = to.x * scale.x;
        const y2 = to.y * scale.y;

        // Draw glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw bright line
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // Draw joints as dots
    landmarks.forEach((landmark, idx) => {
      if (!landmark) return;
      const x = landmark.x * scale.x;
      const y = landmark.y * scale.y;
      const isKeyPoint = [0, 4, 8, 12, 16, 20].includes(idx);

      const dotColor = isKeyPoint ? '#ffff00' : '#ffaaaa';
      ctx.shadowBlur = 15;
      ctx.shadowColor = dotColor;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, isKeyPoint ? 5 : 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  };

  /**
   * Results callback with enhanced visualization
   */
  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    // Draw background with subtle gradient
    ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Add subtle overlay for better contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const handsData = [];
    const neonColors = ['#00ffff', '#ff00ff', '#00ff00'];

    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness =
          results.multiHandedness?.[index]?.label || 'Unknown';

        // Draw neon hand visualization
        drawNeonHand(ctx, landmarks, neonColors[index % neonColors.length]);

        handsData.push({
          landmarks: processLandmarks(landmarks),
          handedness,
          index,
        });
      });
    }

    onHandsDetected?.(handsData);
  }, [onHandsDetected, processLandmarks]);

  /**
   * Initialize hand detection with MediaPipe
   */
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create Hands instance
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        handsRef.current = hands;

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);

        if (videoRef.current && canvasRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: videoWidth,
            height: videoHeight,
          });

          cameraRef.current = camera;
          await camera.start();
        }

        setIsInitialized(true);
        setIsLoading(false);
      } catch (err) {
        console.error('[v0] HandTracker initialization error:', err);
        setError(err.toString());
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop?.();
      }
      if (handsRef.current) {
        handsRef.current.close?.();
      }
    };
  }, [videoWidth, videoHeight, onResults]);

  return (
    <div style={styles.container}>
      <video ref={videoRef} style={{ display: 'none' }} />

      <canvas
        ref={canvasRef}
        width={videoWidth}
        height={videoHeight}
        style={styles.canvas}
      />

      {isLoading && (
        <div style={styles.overlay}>
          <div style={styles.loadingText}>
            Initializing Hand Tracking...
            <div style={styles.spinner} />
          </div>
        </div>
      )}

      {error && (
        <div style={styles.errorOverlay}>
          <div style={styles.errorText}>⚠️ {error}</div>
        </div>
      )}

      {isInitialized && !isLoading && (
        <div style={styles.statusIndicator}>
          <span style={styles.statusDot} /> Active
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    backgroundColor: '#0a0e27',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00d4ff',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(0,212,255,0.3)',
    borderTop: '3px solid #00d4ff',
    borderRadius: '50%',
    marginTop: '10px',
  },
  errorOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    color: '#00d4ff',
  },
  statusDot: {
    width: 8,
    height: 8,
    background: '#00d4ff',
    borderRadius: '50%',
    display: 'inline-block',
  },
};

export default HandTracker;
