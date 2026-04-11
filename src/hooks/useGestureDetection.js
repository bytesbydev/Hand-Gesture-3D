import { useState, useCallback, useRef, useEffect } from 'react';
import { isPinched, getHandCenter, calculateFingerSpread } from '../utils/gestures';

/**
 * Custom hook for detecting hand gestures in real-time
 * Returns gesture state and hand position data
 */
export const useGestureDetection = (handsData) => {
  const [gestureState, setGestureState] = useState({
    type: 'IDLE', // IDLE, DRAWING, DETECTING, GRIPPING, HELD, RELEASING
    leftHand: null,
    rightHand: null,
    activeHand: null,
  });

  const stateRef = useRef({
    lastLeftPinch: false,
    lastRightPinch: false,
    holdingObjectId: null,
  });

  const detectHandGesture = useCallback((hand) => {
    if (!hand || !hand.landmarks) return null;

    const isPinched = hand.landmarks[4] && hand.landmarks[0]
      ? Math.hypot(
          hand.landmarks[4].x - hand.landmarks[0].x,
          hand.landmarks[4].y - hand.landmarks[0].y
        ) < 0.05
      : false;

    // Check if only index finger is extended (drawing)
    const indexExtended = hand.landmarks[8] && hand.landmarks[6]
      ? hand.landmarks[8].y < hand.landmarks[6].y
      : false;

    const middleExtended = hand.landmarks[12] && hand.landmarks[10]
      ? hand.landmarks[12].y < hand.landmarks[10].y
      : false;

    const ringExtended = hand.landmarks[16] && hand.landmarks[14]
      ? hand.landmarks[16].y < hand.landmarks[14].y
      : false;

    const pinkyExtended = hand.landmarks[20] && hand.landmarks[18]
      ? hand.landmarks[20].y < hand.landmarks[18].y
      : false;

    const isDrawing = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
    const isFist = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

    return {
      hand,
      handedness: hand.handedness,
      position: getHandCenter(hand.landmarks),
      isPinched,
      isDrawing,
      isFist,
      indexExtended,
      fingerSpread: calculateFingerSpread(hand.landmarks),
    };
  }, []);

  useEffect(() => {
    if (!handsData || handsData.length === 0) {
      setGestureState({
        type: 'IDLE',
        leftHand: null,
        rightHand: null,
        activeHand: null,
      });
      return;
    }

    const leftHand = handsData.find(h => h.handedness === 'Left');
    const rightHand = handsData.find(h => h.handedness === 'Right');

    const leftGesture = detectHandGesture(leftHand);
    const rightGesture = detectHandGesture(rightHand);

    const state = stateRef.current;

    // Determine gesture type and active hand
    let gestureType = 'IDLE';
    let activeHand = null;

    // Check for drawing (index finger extended, not pinched)
    if (leftGesture && leftGesture.isDrawing && !leftGesture.isPinched) {
      gestureType = 'DRAWING';
      activeHand = leftGesture;
    } else if (rightGesture && rightGesture.isDrawing && !rightGesture.isPinched) {
      gestureType = 'DRAWING';
      activeHand = rightGesture;
    }

    // Check for object gripping/holding (pinch detected)
    if (!gestureType.includes('DRAWING')) {
      if (leftGesture && leftGesture.isPinched) {
        gestureType = state.holdingObjectId ? 'HELD' : 'GRIPPING';
        activeHand = leftGesture;
      } else if (rightGesture && rightGesture.isPinched) {
        gestureType = state.holdingObjectId ? 'HELD' : 'GRIPPING';
        activeHand = rightGesture;
      }
    }

    // Check for object detection (index finger pointing at object, not pinched)
    if (gestureType === 'IDLE') {
      if (leftGesture && leftGesture.indexExtended && !leftGesture.isPinched) {
        gestureType = 'DETECTING';
        activeHand = leftGesture;
      } else if (rightGesture && rightGesture.indexExtended && !rightGesture.isPinched) {
        gestureType = 'DETECTING';
        activeHand = rightGesture;
      }
    }

    setGestureState({
      type: gestureType,
      leftHand: leftGesture,
      rightHand: rightGesture,
      activeHand,
    });

    stateRef.current.lastLeftPinch = leftGesture?.isPinched || false;
    stateRef.current.lastRightPinch = rightGesture?.isPinched || false;
  }, [handsData, detectHandGesture]);

  const setHoldingObject = useCallback((objectId) => {
    stateRef.current.holdingObjectId = objectId;
  }, []);

  const clearHoldingObject = useCallback(() => {
    stateRef.current.holdingObjectId = null;
  }, []);

  return {
    gestureState,
    setHoldingObject,
    clearHoldingObject,
    isDrawing: gestureState.type === 'DRAWING',
    isGripping: gestureState.type === 'GRIPPING',
    isHolding: gestureState.type === 'HELD',
    isDetecting: gestureState.type === 'DETECTING',
  };
};
