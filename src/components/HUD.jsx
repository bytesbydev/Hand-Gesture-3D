/**
 * HUD Component - Modern Neon Interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { isPinched, getHandCenter } from '../utils/gestures.js';

const HUD = ({ handsData, isLoading }) => {
  const [fps, setFps] = useState(0);
  const [handInfo, setHandInfo] = useState({
    count: 0,
    leftDetected: false,
    rightDetected: false,
    leftGesture: 'OPEN',
    rightGesture: 'OPEN',
    leftConfidence: 0,
    rightConfidence: 0,
  });
  const [gestureSpread, setGestureSpread] = useState({ left: 0, right: 0 });

  const fpsRef = useRef({ count: 0, lastTime: performance.now() });
  const pinchStatesRef = useRef({ left: false, right: false });

  // FPS calculation
  useEffect(() => {
    let frameId;

    const updateFps = () => {
      const now = performance.now();
      fpsRef.current.count++;

      if (now >= fpsRef.current.lastTime + 1000) {
        setFps(fpsRef.current.count);
        fpsRef.current.count = 0;
        fpsRef.current.lastTime = now;
      }

      frameId = requestAnimationFrame(updateFps);
    };

    frameId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Calculate finger spread percentage
  const calculateSpread = (landmarks) => {
    if (!landmarks || landmarks.length < 5) return 0;
    const palmCenter = landmarks[0];
    const distances = [4, 8, 12, 16, 20].map(idx => {
      if (!landmarks[idx]) return 0;
      const dx = landmarks[idx].x - palmCenter.x;
      const dy = landmarks[idx].y - palmCenter.y;
      return Math.sqrt(dx * dx + dy * dy);
    });
    const avgDistance = distances.reduce((a, b) => a + b, 0) / 5;
    return Math.min(100, Math.round(avgDistance * 300));
  };

  // Hand data update
  useEffect(() => {
    if (!handsData || handsData.length === 0) {
      setHandInfo({
        count: 0,
        leftDetected: false,
        rightDetected: false,
        leftGesture: 'OPEN',
        rightGesture: 'OPEN',
        leftConfidence: 0,
        rightConfidence: 0,
      });
      setGestureSpread({ left: 0, right: 0 });
      return;
    }

    const leftHand = handsData.find((h) => h.handedness === 'Left');
    const rightHand = handsData.find((h) => h.handedness === 'Right');

    const leftPinched = leftHand && isPinched(leftHand.landmarks, pinchStatesRef.current.left);
    const rightPinched = rightHand && isPinched(rightHand.landmarks, pinchStatesRef.current.right);

    pinchStatesRef.current.left = !!leftPinched;
    pinchStatesRef.current.right = !!rightPinched;

    const leftSpread = leftHand ? calculateSpread(leftHand.landmarks) : 0;
    const rightSpread = rightHand ? calculateSpread(rightHand.landmarks) : 0;

    setGestureSpread({ left: leftSpread, right: rightSpread });

    setHandInfo({
      count: handsData.length,
      leftDetected: !!leftHand,
      rightDetected: !!rightHand,
      leftGesture: leftPinched ? 'FIST' : 'SPREAD',
      rightGesture: rightPinched ? 'FIST' : 'SPREAD',
      leftConfidence: leftHand ? 95 : 0,
      rightConfidence: rightHand ? 95 : 0,
    });
  }, [handsData]);

  return (
    <div style={styles.container}>
      {/* Top-left Stats Panel */}
      <div style={styles.topLeft}>
        <div style={styles.statsPanel}>
          <div style={styles.statsRow}>
            <div style={styles.statLabel}>Hands Detected:</div>
            <div style={styles.statValue}>{handInfo.count}</div>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.statLabel}>FPS:</div>
            <div style={{
              ...styles.statValue,
              color: fps > 30 ? '#00ff00' : fps > 20 ? '#ffaa00' : '#ff4444',
              textShadow: fps > 30 ? '0 0 10px #00ff00' : '0 0 10px #ff6600'
            }}>
              {fps}
            </div>
          </div>
        </div>

        {/* Gesture Info */}
        {handInfo.leftDetected && (
          <div style={styles.gesturePanel}>
            <div style={styles.gesturePanelLabel}>Gesture:</div>
            <div style={styles.gestureValue}>{handInfo.leftGesture}</div>
            <div style={styles.spreadLabel}>Spread:</div>
            <div style={styles.spreadPercentage}>{gestureSpread.left}%</div>
          </div>
        )}
      </div>

      {/* Top-right Title */}
      <div style={styles.topRight}>
        <div style={styles.titleBox}>
          <div style={styles.mainTitle}>HAND GESTURE</div>
          <div style={styles.subtitle}>DETECTION SYSTEM</div>
        </div>
      </div>

      {/* Bottom-left: Hand Status Details */}
      <div style={styles.bottomLeft}>
        <div style={styles.handStatus}>
          {handInfo.leftDetected && (
            <div style={styles.handDetail}>
              <span style={styles.handIcon}>◄</span>
              <div style={styles.handDetailText}>
                <div style={styles.handName}>LEFT HAND</div>
                <div style={styles.handGestureSmall}>{handInfo.leftGesture}</div>
              </div>
            </div>
          )}
          {handInfo.rightDetected && (
            <div style={styles.handDetail}>
              <span style={styles.handIcon}>►</span>
              <div style={styles.handDetailText}>
                <div style={styles.handName}>RIGHT HAND</div>
                <div style={styles.handGestureSmall}>{handInfo.rightGesture}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={styles.centerOverlay}>
          <div style={styles.loadingCircle} />
          <div style={styles.loadingText}>INITIALIZING HAND TRACKING...</div>
        </div>
      )}

      {/* Corner accents */}
      <div style={{ ...styles.cornerAccent, ...styles.topLeftCorner }} />
      <div style={{ ...styles.cornerAccent, ...styles.topRightCorner }} />
      <div style={{ ...styles.cornerAccent, ...styles.bottomLeftCorner }} />
      <div style={{ ...styles.cornerAccent, ...styles.bottomRightCorner }} />
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    fontFamily: '"Courier New", monospace',
    color: '#00ff00',
    zIndex: 100,
  },

  topLeft: {
    position: 'absolute',
    top: '24px',
    left: '24px',
  },

  statsPanel: {
    background: 'rgba(0, 0, 0, 0.7)',
    border: '2px solid #00ffaa',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '16px',
    boxShadow: '0 0 20px rgba(0, 255, 170, 0.4)',
    backdropFilter: 'blur(10px)',
  },

  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
  },

  statLabel: {
    color: '#00ffaa',
    marginRight: '16px',
    fontWeight: 'bold',
  },

  statValue: {
    color: '#00ff00',
    fontSize: '18px',
    fontWeight: 'bold',
    textShadow: '0 0 10px #00ff00',
  },

  gesturePanel: {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #ff00ff',
    borderRadius: '8px',
    padding: '16px 20px',
    boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },

  gesturePanelLabel: {
    color: '#ff00ff',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },

  gestureValue: {
    color: '#ff00ff',
    fontSize: '20px',
    fontWeight: 'bold',
    textShadow: '0 0 10px #ff00ff',
    marginBottom: '12px',
  },

  spreadLabel: {
    color: '#ffaa00',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },

  spreadPercentage: {
    color: '#ffaa00',
    fontSize: '18px',
    fontWeight: 'bold',
    textShadow: '0 0 10px #ffaa00',
  },

  topRight: {
    position: 'absolute',
    top: '24px',
    right: '24px',
  },

  titleBox: {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    padding: '16px 24px',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    textAlign: 'center',
  },

  mainTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#00ffff',
    textShadow: '0 0 15px #00ffff, 0 0 30px rgba(0, 255, 255, 0.5)',
    letterSpacing: '2px',
  },

  subtitle: {
    fontSize: '12px',
    color: '#00aa88',
    marginTop: '4px',
    letterSpacing: '1px',
  },

  bottomLeft: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
  },

  handStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  handDetail: {
    background: 'rgba(0, 0, 0, 0.7)',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },

  handIcon: {
    fontSize: '20px',
    color: '#00ffff',
    fontWeight: 'bold',
  },

  handDetailText: {
    display: 'flex',
    flexDirection: 'column',
  },

  handName: {
    fontSize: '12px',
    color: '#00ffaa',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },

  handGestureSmall: {
    fontSize: '14px',
    color: '#ff00ff',
    fontWeight: 'bold',
    textShadow: '0 0 10px #ff00ff',
  },

  centerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },

  loadingCircle: {
    width: '80px',
    height: '80px',
    border: '3px solid rgba(0, 255, 255, 0.3)',
    borderTop: '3px solid #00ffff',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite',
  },

  loadingText: {
    fontSize: '16px',
    color: '#00ffff',
    textShadow: '0 0 10px #00ffff',
    letterSpacing: '1px',
    fontWeight: 'bold',
  },

  cornerAccent: {
    position: 'absolute',
    width: '24px',
    height: '24px',
    borderColor: '#00ffff',
    borderStyle: 'solid',
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
  },

  topLeftCorner: { top: '12px', left: '12px', borderWidth: '3px 0 0 3px' },
  topRightCorner: { top: '12px', right: '12px', borderWidth: '3px 3px 0 0' },
  bottomLeftCorner: { bottom: '12px', left: '12px', borderWidth: '0 0 3px 3px' },
  bottomRightCorner: { bottom: '12px', right: '12px', borderWidth: '0 3px 3px 0' },
};

export default HUD;
  
