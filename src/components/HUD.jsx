/**
 * HUD Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { isPinched } from '../utils/gestures.js';

const HUD = ({ handsData, isLoading }) => {
  const [fps, setFps] = useState(0);
  const [handInfo, setHandInfo] = useState({
    count: 0,
    leftDetected: false,
    rightDetected: false,
    leftPinched: false,
    rightPinched: false,
  });

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

  // Hand data update
  useEffect(() => {
    if (!handsData || handsData.length === 0) {
      setHandInfo({
        count: 0,
        leftDetected: false,
        rightDetected: false,
        leftPinched: false,
        rightPinched: false,
      });
      return;
    }

    const leftHand = handsData.find((h) => h.handedness === 'Left');
    const rightHand = handsData.find((h) => h.handedness === 'Right');

    const leftPinched =
      leftHand && isPinched(leftHand.landmarks, pinchStatesRef.current.left);

    const rightPinched =
      rightHand && isPinched(rightHand.landmarks, pinchStatesRef.current.right);

    pinchStatesRef.current.left = !!leftPinched;
    pinchStatesRef.current.right = !!rightPinched;

    setHandInfo({
      count: handsData.length,
      leftDetected: !!leftHand,
      rightDetected: !!rightHand,
      leftPinched: !!leftPinched,
      rightPinched: !!rightPinched,
    });
  }, [handsData]);

  return (
    <div style={styles.container}>
      {/* Top-left */}
      <div style={styles.topLeft}>
        <div style={styles.title}>
          <span style={styles.titleGlow}>⚡</span>
          GESTURE CONTROL
        </div>
        <div style={styles.subtitle}>Hand Tracking System</div>
      </div>

      {/* Top-right */}
      <div style={styles.topRight}>
        <div style={styles.metric}>
          <span style={styles.label}>FPS</span>
          <span
            style={{
              ...styles.value,
              color: fps > 30 ? '#00ff00' : '#ffaa00',
            }}
          >
            {fps}
          </span>
        </div>

        <div style={styles.metric}>
          <span style={styles.label}>HANDS</span>
          <span style={styles.value}>{handInfo.count}</span>
        </div>
      </div>

      {/* Bottom-left */}
      <div style={styles.bottomLeft}>
        <div style={styles.handStatus}>
          <div
            style={{
              ...styles.handIndicator,
              opacity: handInfo.leftDetected ? 1 : 0.3,
            }}
          >
            <span style={styles.handDot} />
            LEFT
            {handInfo.leftDetected && (
              <span
                style={{
                  ...styles.gesture,
                  color: handInfo.leftPinched ? '#ff6600' : '#00ff00',
                }}
              >
                {handInfo.leftPinched ? '✊ PINCH' : '✋ OPEN'}
              </span>
            )}
          </div>

          <div
            style={{
              ...styles.handIndicator,
              opacity: handInfo.rightDetected ? 1 : 0.3,
            }}
          >
            <span style={styles.handDot} />
            RIGHT
            {handInfo.rightDetected && (
              <span
                style={{
                  ...styles.gesture,
                  color: handInfo.rightPinched ? '#ff6600' : '#00ff00',
                }}
              >
                {handInfo.rightPinched ? '✊ PINCH' : '✋ OPEN'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom-right */}
      <div style={styles.bottomRight}>
        <div style={styles.instruction}>
          <span style={styles.instructionKey}>Move</span>
          <span>Hand Position</span>
        </div>
        <div style={styles.instruction}>
          <span style={styles.instructionKey}>Scale</span>
          <span>Both Hands</span>
        </div>
        <div style={styles.instruction}>
          <span style={styles.instructionKey}>Grab</span>
          <span>Pinch Gesture</span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={styles.centerOverlay}>
          <div style={styles.loadingCircle} />
          <div style={styles.loadingText}>INITIALIZING...</div>
        </div>
      )}

      {/* Effects */}
      <div style={styles.scanlines} />

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

  topLeft: { position: 'absolute', top: '24px', left: '24px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#00ffff' },
  titleGlow: { marginRight: '8px' },
  subtitle: { fontSize: '12px', color: '#00aa88' },

  topRight: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    display: 'flex',
    gap: '32px',
  },

  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  label: { fontSize: '11px' },
  value: { fontSize: '20px', fontWeight: 'bold' },

  bottomLeft: { position: 'absolute', bottom: '24px', left: '24px' },

  handStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  handIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  handDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#00ff00',
  },

  gesture: { marginLeft: '8px', fontWeight: 'bold' },

  bottomRight: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    textAlign: 'right',
  },

  instruction: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    fontSize: '12px',
  },

  instructionKey: { fontWeight: 'bold' },

  centerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },

  loadingCircle: {
    width: '60px',
    height: '60px',
    border: '3px solid #00ffff',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
  },

  loadingText: { fontSize: '14px' },

  scanlines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  cornerAccent: {
    position: 'absolute',
    width: '24px',
    height: '24px',
    borderColor: '#00ffff',
    borderStyle: 'solid',
  },

  topLeftCorner: { top: '12px', left: '12px', borderWidth: '3px 0 0 3px' },
  topRightCorner: { top: '12px', right: '12px', borderWidth: '3px 3px 0 0' },
  bottomLeftCorner: { bottom: '12px', left: '12px', borderWidth: '0 0 3px 3px' },
  bottomRightCorner: { bottom: '12px', right: '12px', borderWidth: '0 3px 3px 0' },
};

export default HUD;
  