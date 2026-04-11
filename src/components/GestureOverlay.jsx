import React, { useState, useEffect, useRef } from 'react';

/**
 * GestureOverlay Component
 * Displays real-time gesture state, FPS, and interactive statistics
 */
const GestureOverlay = ({
  gestureState,
  objects,
  isDrawing,
  fps,
  objectCount,
}) => {
  const [fpsValue, setFpsValue] = useState(0);
  const fpsRef = useRef({ count: 0, lastTime: performance.now() });

  // Calculate FPS
  useEffect(() => {
    let frameId;

    const updateFps = () => {
      const now = performance.now();
      fpsRef.current.count++;

      if (now >= fpsRef.current.lastTime + 1000) {
        setFpsValue(fpsRef.current.count);
        fpsRef.current.count = 0;
        fpsRef.current.lastTime = now;
      }

      frameId = requestAnimationFrame(updateFps);
    };

    frameId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const getGestureColor = (type) => {
    switch (type) {
      case 'DRAWING':
        return '#00ff88';
      case 'GRIPPING':
        return '#ffaa00';
      case 'HELD':
        return '#ff00ff';
      case 'DETECTING':
        return '#00ffff';
      default:
        return '#00ffaa';
    }
  };

  const getGestureLabel = (type) => {
    switch (type) {
      case 'DRAWING':
        return 'CREATING OBJECT';
      case 'GRIPPING':
        return 'PICKING UP';
      case 'HELD':
        return 'HOLDING OBJECT';
      case 'DETECTING':
        return 'DETECTING OBJECT';
      default:
        return 'IDLE';
    }
  };

  const heldObjects = objects.filter(obj => obj.isHeld).length;

  return (
    <div style={styles.container}>
      {/* Top-left Stats Panel */}
      <div style={styles.statsPanel}>
        <div style={styles.statRow}>
          <div style={styles.label}>FPS:</div>
          <div
            style={{
              ...styles.value,
              color: fpsValue > 30 ? '#00ff00' : fpsValue > 20 ? '#ffaa00' : '#ff4444',
              textShadow: `0 0 10px ${fpsValue > 30 ? '#00ff00' : fpsValue > 20 ? '#ffaa00' : '#ff4444'}`,
            }}
          >
            {fpsValue}
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.statRow}>
          <div style={styles.label}>Objects:</div>
          <div style={{ ...styles.value, color: '#00ffaa' }}>{objectCount}</div>
        </div>

        <div style={styles.statRow}>
          <div style={styles.label}>Held:</div>
          <div
            style={{
              ...styles.value,
              color: heldObjects > 0 ? '#ff00ff' : '#666666',
              textShadow: heldObjects > 0 ? '0 0 10px #ff00ff' : 'none',
            }}
          >
            {heldObjects}
          </div>
        </div>
      </div>

      {/* Gesture State Panel */}
      <div
        style={{
          ...styles.gesturePanel,
          borderColor: getGestureColor(gestureState.type),
          boxShadow: `0 0 20px ${getGestureColor(gestureState.type)}50`,
        }}
      >
        <div style={{ ...styles.gestureLabel, color: getGestureColor(gestureState.type) }}>
          {getGestureLabel(gestureState.type)}
        </div>

        {/* Hand Info */}
        <div style={styles.handInfo}>
          {gestureState.leftHand && (
            <div style={styles.handDetail}>
              <span style={styles.handIcon}>◄</span>
              <div style={styles.handText}>
                <div style={styles.handName}>LEFT</div>
                {gestureState.leftHand.isPinched && (
                  <div style={styles.gesture}>PINCH</div>
                )}
              </div>
            </div>
          )}

          {gestureState.rightHand && (
            <div style={styles.handDetail}>
              <span style={styles.handIcon}>►</span>
              <div style={styles.handText}>
                <div style={styles.handName}>RIGHT</div>
                {gestureState.rightHand.isPinched && (
                  <div style={styles.gesture}>PINCH</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawing Instructions */}
        {isDrawing && (
          <div style={styles.instruction}>
            Drawing in progress...
          </div>
        )}
      </div>

      {/* Corner Accents */}
      <div style={{ ...styles.corner, ...styles.topLeft }} />
      <div style={{ ...styles.corner, ...styles.topRight }} />
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
    zIndex: 100,
  },

  statsPanel: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #00ffaa',
    borderRadius: '8px',
    padding: '16px 20px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(0, 255, 170, 0.3)',
  },

  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    minWidth: '140px',
  },

  label: {
    color: '#00ffaa',
    fontWeight: 'bold',
    marginRight: '12px',
  },

  value: {
    fontSize: '16px',
    fontWeight: 'bold',
  },

  divider: {
    height: '1px',
    background: 'rgba(0, 255, 170, 0.3)',
    margin: '8px 0',
  },

  gesturePanel: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    background: 'rgba(0, 0, 0, 0.85)',
    border: '2px solid',
    borderRadius: '8px',
    padding: '16px 20px',
    backdropFilter: 'blur(10px)',
    minWidth: '200px',
    maxWidth: '280px',
  },

  gestureLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    letterSpacing: '1px',
    textShadow: '0 0 10px currentColor',
  },

  handInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },

  handDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#00ffff',
  },

  handIcon: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#00ffff',
  },

  handText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  handName: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#00ffaa',
    letterSpacing: '0.5px',
  },

  gesture: {
    fontSize: '10px',
    color: '#ffaa00',
    fontWeight: 'bold',
  },

  instruction: {
    fontSize: '11px',
    color: '#00ff88',
    fontStyle: 'italic',
    animation: 'pulse 1.5s ease-in-out infinite',
  },

  corner: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderColor: '#00ffff',
    borderStyle: 'solid',
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
  },

  topLeft: {
    top: '12px',
    left: '12px',
    borderWidth: '2px 0 0 2px',
  },

  topRight: {
    top: '12px',
    right: '12px',
    borderWidth: '2px 2px 0 0',
  },
};

export default GestureOverlay;
