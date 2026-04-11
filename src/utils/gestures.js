/**
 * Gesture Detection Utilities
 * Handles pinch detection, distance calculations, and hand rotation
 */

const PINCH_THRESHOLD = 0.05; // Distance threshold for pinch (5% of hand size)
const PINCH_HYSTERESIS = 0.02; // Hysteresis to prevent flickering

// Landmark indices from MediaPipe Hands
export const LANDMARKS = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_TIP: 20,
  PALM_BASE: 0,
  MIDDLE_FINGER_MCP: 9,
};

/**
 * Calculate Euclidean distance between two 3D points
 */
export function distance3D(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = (point2.z || 0) - (point1.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate distance between two hands
 * Used for scaling gestures
 */
export function getHandDistance(hand1, hand2) {
  if (!hand1 || !hand2) return 0;
  // Use wrist (landmark 0) for hand-to-hand distance
  return distance3D(hand1[0], hand2[0]);
}

/**
 * Detect pinch gesture (thumb tip to index tip)
 * Returns boolean indicating if pinch is active
 */
export function isPinched(hand, previousPinchState = false) {
  if (!hand || hand.length < 9) return false;

  const thumbTip = hand[LANDMARKS.THUMB_TIP];
  const indexTip = hand[LANDMARKS.INDEX_TIP];

  if (!thumbTip || !indexTip) return false;

  const dist = distance3D(thumbTip, indexTip);
  
  // Use hysteresis to prevent flickering
  if (previousPinchState) {
    return dist < PINCH_THRESHOLD + PINCH_HYSTERESIS;
  } else {
    return dist < PINCH_THRESHOLD - PINCH_HYSTERESIS;
  }
}

/**
 * Get hand center (palm center) position
 * Used for moving the object
 */
export function getHandCenter(hand) {
  if (!hand || hand.length === 0) return null;

  let sumX = 0, sumY = 0, sumZ = 0;
  for (let landmark of hand) {
    if (landmark) {
      sumX += landmark.x;
      sumY += landmark.y;
      sumZ += (landmark.z || 0);
    }
  }

  const count = hand.length;
  return {
    x: sumX / count,
    y: sumY / count,
    z: sumZ / count,
  };
}

/**
 * Get hand rotation from wrist to middle finger
 * Returns rotation angle in radians
 */
export function getHandRotation(hand) {
  if (!hand || hand.length < 10) return 0;

  const wrist = hand[LANDMARKS.WRIST];
  const middleBase = hand[LANDMARKS.MIDDLE_FINGER_MCP];

  if (!wrist || !middleBase) return 0;

  const dx = middleBase.x - wrist.x;
  const dy = middleBase.y - wrist.y;

  return Math.atan2(dy, dx);
}

/**
 * Detect if hand is open (all fingers extended)
 */
export function isHandOpen(hand) {
  if (!hand || hand.length < 21) return false;

  const fingerTips = [
    LANDMARKS.THUMB_TIP,
    LANDMARKS.INDEX_TIP,
    LANDMARKS.MIDDLE_TIP,
    LANDMARKS.RING_TIP,
    LANDMARKS.PINKY_TIP,
  ];

  const wrist = hand[LANDMARKS.WRIST];
  if (!wrist) return false;

  // Check if all finger tips are below wrist (in screen space)
  for (let tipIndex of fingerTips) {
    const tip = hand[tipIndex];
    if (!tip) return false;
    // All tips should be away from wrist
    if (distance3D(wrist, tip) < 0.1) return false;
  }

  return true;
}

/**
 * Detect grab gesture (all fingers curled)
 */
export function isHandGrabbing(hand) {
  if (!hand || hand.length < 21) return false;

  const fingerTips = [
    LANDMARKS.THUMB_TIP,
    LANDMARKS.INDEX_TIP,
    LANDMARKS.MIDDLE_TIP,
    LANDMARKS.RING_TIP,
    LANDMARKS.PINKY_TIP,
  ];

  const wrist = hand[LANDMARKS.WRIST];
  if (!wrist) return false;

  let closedFingers = 0;

  for (let tipIndex of fingerTips) {
    const tip = hand[tipIndex];
    if (!tip) continue;
    if (distance3D(wrist, tip) < 0.15) {
      closedFingers++;
    }
  }

  return closedFingers >= 4; // At least 4 fingers closed
}

/**
 * Calculate bounding box of hand
 * Returns {minX, maxX, minY, maxY, width, height}
 */
export function getHandBoundingBox(hand) {
  if (!hand || hand.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let landmark of hand) {
    if (landmark) {
      minX = Math.min(minX, landmark.x);
      maxX = Math.max(maxX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxY = Math.max(maxY, landmark.y);
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Normalize hand position to 3D world space
 * Converts screen coordinates (0-1) to world coordinates
 */
export function normalizeHandPosition(screenPos, worldScale = 5) {
  if (!screenPos) return null;

  // Screen space is typically (0-1) for x and (0-1) for y
  // Convert to world space centered at origin
  return {
    x: (screenPos.x - 0.5) * worldScale,
    y: -(screenPos.y - 0.5) * worldScale, // Invert Y axis
    z: (screenPos.z || 0) * worldScale * 0.5,
  };
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get two-hand scaling factor
 * Returns scale multiplier based on distance between hands
 */
export function getTwoHandScale(hand1, hand2, baseDistance = 0.3) {
  if (!hand1 || !hand2) return 1;

  const distance = getHandDistance(hand1, hand2);
  
  // Clamp between 0.5x and 3x scale
  const scale = clamp(distance / baseDistance, 0.5, 3);
  return scale;
}

/**
 * Get hand velocity (change in position over time)
 */
export function getHandVelocity(currentPos, previousPos) {
  if (!currentPos || !previousPos) return { x: 0, y: 0, z: 0 };

  return {
    x: currentPos.x - previousPos.x,
    y: currentPos.y - previousPos.y,
    z: (currentPos.z || 0) - (previousPos.z || 0),
  };
}

/**
 * Calculate finger spread percentage
 * Measures how much fingers are extended from palm
 */
export function calculateFingerSpread(hand) {
  if (!hand || hand.length < 21) return 0;

  const palmCenter = getHandCenter(hand);
  if (!palmCenter) return 0;

  const fingerTips = [
    hand[LANDMARKS.THUMB_TIP],
    hand[LANDMARKS.INDEX_TIP],
    hand[LANDMARKS.MIDDLE_TIP],
    hand[LANDMARKS.RING_TIP],
    hand[LANDMARKS.PINKY_TIP],
  ];

  let totalDistance = 0;
  let count = 0;

  for (let tip of fingerTips) {
    if (tip) {
      totalDistance += distance3D(palmCenter, tip);
      count++;
    }
  }

  const avgDistance = totalDistance / count;
  return Math.min(100, Math.round(avgDistance * 300)); // Scale to 0-100 percentage
}
