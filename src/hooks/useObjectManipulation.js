import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for managing real-time object manipulation
 * Handles picking up, holding, moving, and dropping objects
 */
export const useObjectManipulation = (objects, updateObject, gestureState) => {
  const [manipulationState, setManipulationState] = useState({
    heldObjectId: null,
    heldByHand: null,
    initialPosition: null,
    offsetFromHandCenter: { x: 0, y: 0 },
  });

  const stateRef = useRef({
    wasGripping: false,
    lastHandPosition: null,
  });

  // Handle object pickup when gripping
  useEffect(() => {
    const isCurrentlyGripping = gestureState.type === 'GRIPPING' || gestureState.type === 'HELD';
    const wasGripping = stateRef.current.wasGripping;

    // Transition from idle/detecting to gripping
    if (isCurrentlyGripping && !wasGripping && gestureState.activeHand) {
      const handPos = gestureState.activeHand.position;

      // Find object at hand position
      let heldObject = null;
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const distance = Math.hypot(
          obj.position.x - handPos.x,
          obj.position.y - handPos.y
        );
        if (distance <= obj.size) {
          heldObject = obj;
          break;
        }
      }

      if (heldObject) {
        const offsetX = heldObject.position.x - handPos.x;
        const offsetY = heldObject.position.y - handPos.y;

        setManipulationState({
          heldObjectId: heldObject.id,
          heldByHand: gestureState.activeHand.handedness,
          initialPosition: { ...heldObject.position },
          offsetFromHandCenter: { x: offsetX, y: offsetY },
        });

        // Mark object as held
        updateObject(heldObject.id, {
          isHeld: true,
          heldBy: gestureState.activeHand.handedness,
          opacity: 1,
        });
      }
    }
    // Release object when pinch ends
    else if (!isCurrentlyGripping && wasGripping && manipulationState.heldObjectId) {
      const heldObj = objects.find(o => o.id === manipulationState.heldObjectId);
      if (heldObj) {
        // Apply velocity based on recent hand movement
        const velocity = stateRef.current.lastHandPosition
          ? {
              x: (gestureState.activeHand?.position?.x || heldObj.position.x) - stateRef.current.lastHandPosition.x,
              y: (gestureState.activeHand?.position?.y || heldObj.position.y) - stateRef.current.lastHandPosition.y,
            }
          : { x: 0, y: 0 };

        updateObject(heldObj.id, {
          isHeld: false,
          heldBy: null,
          velocity,
          opacity: 0.85,
        });
      }

      setManipulationState({
        heldObjectId: null,
        heldByHand: null,
        initialPosition: null,
        offsetFromHandCenter: { x: 0, y: 0 },
      });
    }

    stateRef.current.wasGripping = isCurrentlyGripping;
  }, [gestureState, objects, updateObject, manipulationState.heldObjectId]);

  // Update held object position in real-time
  useEffect(() => {
    if (
      manipulationState.heldObjectId &&
      gestureState.activeHand &&
      gestureState.type === 'HELD'
    ) {
      const handPos = gestureState.activeHand.position;
      const newPosition = {
        x: handPos.x + manipulationState.offsetFromHandCenter.x,
        y: handPos.y + manipulationState.offsetFromHandCenter.y,
      };

      updateObject(manipulationState.heldObjectId, {
        position: newPosition,
        velocity: { x: 0, y: 0 }, // Clear velocity while being held
      });

      stateRef.current.lastHandPosition = handPos;
    }
  }, [gestureState, manipulationState, updateObject]);

  // Handle dual-hand transformations (scale/rotate)
  useEffect(() => {
    if (
      manipulationState.heldObjectId &&
      gestureState.leftHand &&
      gestureState.rightHand &&
      gestureState.type === 'HELD'
    ) {
      const leftPos = gestureState.leftHand.position;
      const rightPos = gestureState.rightHand.position;

      const currentDistance = Math.hypot(
        rightPos.x - leftPos.x,
        rightPos.y - leftPos.y
      );

      // Store initial distance for comparison (first frame of dual-hand)
      if (!stateRef.current.initialDistance) {
        stateRef.current.initialDistance = currentDistance;
        return;
      }

      const distanceRatio = currentDistance / stateRef.current.initialDistance;
      const scaleFactor = Math.max(0.5, Math.min(distanceRatio, 2)); // Clamp scale between 0.5 and 2

      updateObject(manipulationState.heldObjectId, {
        scale: { x: scaleFactor, y: scaleFactor },
      });

      // Calculate rotation from hand positions
      const angle = Math.atan2(rightPos.y - leftPos.y, rightPos.x - leftPos.x);
      if (!stateRef.current.initialRotation) {
        stateRef.current.initialRotation = angle;
      }
      const rotationDelta = angle - stateRef.current.initialRotation;
      updateObject(manipulationState.heldObjectId, {
        rotation: rotationDelta,
      });
    } else {
      // Reset dual-hand state when not holding with both hands
      stateRef.current.initialDistance = null;
      stateRef.current.initialRotation = null;
    }
  }, [gestureState, manipulationState, updateObject]);

  const resetManipulation = useCallback(() => {
    setManipulationState({
      heldObjectId: null,
      heldByHand: null,
      initialPosition: null,
      offsetFromHandCenter: { x: 0, y: 0 },
    });
    stateRef.current = {
      wasGripping: false,
      lastHandPosition: null,
    };
  }, []);

  return {
    manipulationState,
    resetManipulation,
    isObjectHeld: manipulationState.heldObjectId !== null,
  };
};
