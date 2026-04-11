import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing drawable objects (circles, spheres, cubes)
 * Handles creation, selection, manipulation, and deletion
 */
export const useDrawingObjects = () => {
  const [objects, setObjects] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const objectIdRef = useRef(0);

  const colors = [
    '#00ffff', // cyan
    '#00ff88', // lime
    '#ffaa00', // orange
    '#ff00ff', // magenta
    '#00ffaa', // turquoise
    '#ff3366', // pink
  ];

  const createObject = useCallback((position, drawingPath) => {
    const objectId = `obj_${objectIdRef.current++}`;
    
    // Determine object type based on drawing path characteristics
    const pathLength = drawingPath.length;
    let objectType = 'circle'; // default
    
    if (pathLength > 50) {
      // Longer paths create larger objects
      objectType = Math.random() > 0.5 ? 'sphere' : 'cube';
    }

    // Calculate size from drawing path
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    drawingPath.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    const width = maxX - minX || 10;
    const height = maxY - minY || 10;
    const size = Math.max(width, height);

    const newObject = {
      id: objectId,
      type: objectType,
      position: { x: position.x, y: position.y },
      size: Math.max(20, Math.min(size, 100)),
      scale: { x: 1, y: 1 },
      rotation: 0,
      velocity: { x: 0, y: 0 },
      color: colors[objectIdRef.current % colors.length],
      isHeld: false,
      heldBy: null,
      createdAt: Date.now(),
      isSelected: false,
      opacity: 1,
      drawingPath: drawingPath, // Store original drawing for rendering
    };

    setObjects(prev => [...prev, newObject]);
    return newObject;
  }, [colors]);

  const updateObject = useCallback((objectId, updates) => {
    setObjects(prev =>
      prev.map(obj =>
        obj.id === objectId ? { ...obj, ...updates } : obj
      )
    );
  }, []);

  const deleteObject = useCallback((objectId) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null);
    }
  }, [selectedObjectId]);

  const deleteAllObjects = useCallback(() => {
    setObjects([]);
    setSelectedObjectId(null);
  }, []);

  const selectObject = useCallback((objectId) => {
    setSelectedObjectId(objectId);
    setObjects(prev =>
      prev.map(obj => ({
        ...obj,
        isSelected: obj.id === objectId,
      }))
    );
  }, []);

  const deselectObject = useCallback(() => {
    setSelectedObjectId(null);
    setObjects(prev =>
      prev.map(obj => ({ ...obj, isSelected: false }))
    );
  }, []);

  const getObjectAtPosition = useCallback((position, threshold = 50) => {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const distance = Math.hypot(
        obj.position.x - position.x,
        obj.position.y - position.y
      );
      if (distance <= obj.size / 2 + threshold) {
        return obj;
      }
    }
    return null;
  }, [objects]);

  const setObjectHeld = useCallback((objectId, isHeld, handIndex = null) => {
    updateObject(objectId, {
      isHeld,
      heldBy: isHeld ? handIndex : null,
      opacity: isHeld ? 1 : 0.8,
    });
  }, [updateObject]);

  const constrainPosition = useCallback((position, objectSize, canvasWidth, canvasHeight) => {
    const radius = objectSize / 2;
    return {
      x: Math.max(radius, Math.min(position.x, canvasWidth - radius)),
      y: Math.max(radius, Math.min(position.y, canvasHeight - radius)),
    };
  }, []);

  const applyVelocityDampening = useCallback((objectId, dampingFactor = 0.95) => {
    setObjects(prev =>
      prev.map(obj => {
        if (obj.id === objectId && !obj.isHeld) {
          return {
            ...obj,
            velocity: {
              x: obj.velocity.x * dampingFactor,
              y: obj.velocity.y * dampingFactor,
            },
          };
        }
        return obj;
      })
    );
  }, []);

  return {
    objects,
    selectedObjectId,
    createObject,
    updateObject,
    deleteObject,
    deleteAllObjects,
    selectObject,
    deselectObject,
    getObjectAtPosition,
    setObjectHeld,
    constrainPosition,
    applyVelocityDampening,
  };
};
