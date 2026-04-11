/**
 * App Component - Air Drawing & Object Manipulation System
 * Main application for real-time hand gesture-based drawing and object interaction
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import HandTracker from './components/HandTracker';
import DrawingCanvas from './components/DrawingCanvas';
import GestureOverlay from './components/GestureOverlay';
import { useGestureDetection } from './hooks/useGestureDetection';
import { useDrawingObjects } from './hooks/useDrawingObjects';
import { useDrawingState } from './hooks/useDrawingState';
import { useObjectManipulation } from './hooks/useObjectManipulation';
import './App.css';

function App() {
  const [handsData, setHandsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });

  const containerRef = useRef(null);

  // Custom hooks for gesture and object management
  const gestureState = useGestureDetection(handsData);
  const drawingObjects = useDrawingObjects();
  const drawingState = useDrawingState(
    gestureState.gestureState,
    drawingObjects.createObject
  );
  const manipulation = useObjectManipulation(
    drawingObjects.objects,
    drawingObjects.updateObject,
    gestureState.gestureState
  );

  /**
   * Callback from HandTracker when hands are detected
   */
  const handleHandsDetected = useCallback((hands) => {
    setHandsData(hands);
    setIsLoading(false);

    // Update held object tracking
    if (manipulation.isObjectHeld) {
      gestureState.setHoldingObject(manipulation.manipulationState.heldObjectId);
    } else {
      gestureState.clearHoldingObject();
    }
  }, [manipulation, gestureState]);

  // Apply velocity dampening to released objects
  useEffect(() => {
    const dampingInterval = setInterval(() => {
      drawingObjects.objects.forEach(obj => {
        if (!obj.isHeld && (obj.velocity.x !== 0 || obj.velocity.y !== 0)) {
          drawingObjects.applyVelocityDampening(obj.id, 0.92);

          // Update position based on velocity
          const newPos = drawingObjects.constrainPosition(
            {
              x: obj.position.x + obj.velocity.x,
              y: obj.position.y + obj.velocity.y,
            },
            obj.size,
            canvasSize.width,
            canvasSize.height
          );

          drawingObjects.updateObject(obj.id, {
            position: newPos,
          });
        }
      });
    }, 16); // ~60fps

    return () => clearInterval(dampingInterval);
  }, [drawingObjects, canvasSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        drawingObjects.deleteAllObjects();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [drawingObjects]);

  return (
    <div className="app">
      {/* Main drawing container */}
      <div className="drawing-container" ref={containerRef}>
        {/* Hand tracking video feed (hidden, used for detection) */}
        <div className="video-section-hidden">
          <HandTracker
            onHandsDetected={handleHandsDetected}
            videoWidth={640}
            videoHeight={480}
          />
        </div>

        {/* Canvas layer - draws objects and current drawing path */}
        <DrawingCanvas
          objects={drawingObjects.objects}
          currentDrawingPath={drawingState.currentDrawingPath}
          isDrawing={drawingState.isCurrentlyDrawing}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />

        {/* Gesture overlay - shows real-time stats and gesture state */}
        <GestureOverlay
          gestureState={gestureState.gestureState}
          objects={drawingObjects.objects}
          isDrawing={drawingState.isCurrentlyDrawing}
          fps={0}
          objectCount={drawingObjects.objects.length}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingSpinner} />
            <div style={styles.loadingText}>INITIALIZING HAND DETECTION...</div>
          </div>
        )}
      </div>

      {/* Footer instructions */}
      <div style={styles.footer}>
        <div style={styles.instructions}>
          <span style={styles.instructionItem}>Raise index finger to draw</span>
          <span style={styles.separator}>•</span>
          <span style={styles.instructionItem}>Pinch to hold object</span>
          <span style={styles.separator}>•</span>
          <span style={styles.instructionItem}>Press 'C' to clear all</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 14, 39, 0.95)',
    zIndex: 1000,
  },

  loadingSpinner: {
    width: '80px',
    height: '80px',
    border: '3px solid rgba(0, 255, 255, 0.2)',
    borderTop: '3px solid #00ffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },

  loadingText: {
    color: '#00ffff',
    fontSize: '16px',
    letterSpacing: '2px',
    fontWeight: 'bold',
    textShadow: '0 0 10px #00ffff',
  },

  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(10, 14, 39, 0.9)',
    borderTop: '1px solid rgba(0, 255, 170, 0.3)',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'center',
  },

  instructions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    color: '#00ffaa',
    fontSize: '12px',
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.5px',
  },

  instructionItem: {
    color: '#00ffaa',
  },

  separator: {
    color: 'rgba(0, 255, 170, 0.5)',
  },
};

export default App;
