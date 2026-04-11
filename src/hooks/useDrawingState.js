import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for managing drawing state
 * Tracks drawing path points and finalizes objects
 */
export const useDrawingState = (gestureState, onObjectCreated) => {
  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState(false);
  const [currentDrawingPath, setCurrentDrawingPath] = useState([]);

  const stateRef = useRef({
    wasDrawing: false,
    lastRecordedTime: 0,
    minPointDistance: 3, // Minimum distance between recorded points
  });

  // Handle drawing state transitions
  useEffect(() => {
    const isDrawing = gestureState.type === 'DRAWING';
    const wasDrawing = stateRef.current.wasDrawing;

    // Start drawing
    if (isDrawing && !wasDrawing) {
      setIsCurrentlyDrawing(true);
      setCurrentDrawingPath([]);
    }

    // Stop drawing (fist gesture)
    if (!isDrawing && wasDrawing && currentDrawingPath.length > 0) {
      setIsCurrentlyDrawing(false);
      
      // Create object from completed drawing path
      if (currentDrawingPath.length > 5 && onObjectCreated) {
        const lastPoint = currentDrawingPath[currentDrawingPath.length - 1];
        onObjectCreated(
          { x: lastPoint.x, y: lastPoint.y },
          currentDrawingPath
        );
      }

      setCurrentDrawingPath([]);
    }

    stateRef.current.wasDrawing = isDrawing;
  }, [gestureState.type, currentDrawingPath, onObjectCreated]);

  // Record drawing points when hand is in drawing gesture
  useEffect(() => {
    if (
      isCurrentlyDrawing &&
      gestureState.activeHand &&
      gestureState.type === 'DRAWING'
    ) {
      const handPos = gestureState.activeHand.position;
      const now = Date.now();

      setCurrentDrawingPath(prev => {
        // Check if enough time has passed and distance is sufficient
        if (prev.length === 0) {
          return [{ x: handPos.x, y: handPos.y, time: now }];
        }

        const lastPoint = prev[prev.length - 1];
        const distance = Math.hypot(
          handPos.x - lastPoint.x,
          handPos.y - lastPoint.y
        );

        // Only add point if it's far enough from the last one
        if (distance > stateRef.current.minPointDistance) {
          return [...prev, { x: handPos.x, y: handPos.y, time: now }];
        }

        return prev;
      });
    }
  }, [isCurrentlyDrawing, gestureState]);

  const clearDrawing = useCallback(() => {
    setIsCurrentlyDrawing(false);
    setCurrentDrawingPath([]);
  }, []);

  const getCurrentDrawingBounds = useCallback(() => {
    if (currentDrawingPath.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    currentDrawingPath.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [currentDrawingPath]);

  return {
    isCurrentlyDrawing,
    currentDrawingPath,
    clearDrawing,
    getCurrentDrawingBounds,
  };
};
