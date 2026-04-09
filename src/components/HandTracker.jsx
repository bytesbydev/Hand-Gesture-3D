/**
 * HandTracker Component (FINAL SAFE LOCAL VERSION)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

const HandTracker = ({ onHandsDetected, videoWidth = 640, videoHeight = 480 }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * 🔥 LOAD LOCAL MEDIAPIPE SCRIPTS
   */
  const loadScripts = () => {
    return new Promise((resolve, reject) => {
      const handScript = document.createElement('script');
      handScript.src = '/hands/hands.js';

      handScript.onload = () => {
        const cameraScript = document.createElement('script');
        cameraScript.src = '/camera_utils/camera_utils.js';

        cameraScript.onload = () => resolve();
        cameraScript.onerror = () => reject('Camera utils failed');

        document.body.appendChild(cameraScript);
      };

      handScript.onerror = () => reject('Hands failed');
      document.body.appendChild(handScript);
    });
  };

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
   * Results callback
   */
  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    const handsData = [];

    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness =
          results.multiHandedness?.[index]?.label || 'Unknown';

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
   * Initialize
   */
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // ✅ Load scripts locally
        await loadScripts();

        // ✅ Use window object (NO imports)
        const hands = new window.Hands({
          locateFile: (file) => `/hands/${file}`,
        });

        handsRef.current = hands;

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);

        if (videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: videoWidth,
            height: videoHeight,
          });

          cameraRef.current = camera;
          camera.start();
        }

        setIsInitialized(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing:', err);
        setError(err.toString());
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cameraRef.current?.stop();
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
