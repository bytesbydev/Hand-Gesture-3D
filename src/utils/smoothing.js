/**
 * Smoothing Utilities
 * Linear interpolation and smoothing filters to reduce hand tracking jitter
 */

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Linear interpolation for 3D vectors
 * @param {Object} a - Start vector {x, y, z}
 * @param {Object} b - End vector {x, y, z}
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated vector
 */
export function lerpVector(a, b, t) {
  if (!a || !b) return b || a;

  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z || 0, b.z || 0, t),
  };
}

/**
 * Exponential moving average smoothing
 * Provides smoother motion with less lag than simple lerp
 * @param {number} current - Current value
 * @param {number} previous - Previous smoothed value
 * @param {number} alpha - Smoothing factor (0-1, lower = more smoothing)
 * @returns {number} Smoothed value
 */
export function exponentialSmooth(current, previous, alpha = 0.3) {
  if (previous === undefined || previous === null) return current;
  return lerp(previous, current, alpha);
}

/**
 * Exponential moving average for 3D vectors
 */
export function exponentialSmoothVector(current, previous, alpha = 0.3) {
  if (!previous) return current;
  
  return {
    x: exponentialSmooth(current.x, previous.x, alpha),
    y: exponentialSmooth(current.y, previous.y, alpha),
    z: exponentialSmooth(current.z || 0, previous.z || 0, alpha),
  };
}

/**
 * Dead zone filter
 * Ignores small movements to reduce micro-jitters
 * @param {number} value - Input value
 * @param {number} threshold - Dead zone threshold
 * @returns {number} Filtered value (0 if within dead zone)
 */
export function deadZone(value, threshold = 0.01) {
  if (Math.abs(value) < threshold) return 0;
  return value;
}

/**
 * Dead zone filter for vectors
 */
export function deadZoneVector(vector, threshold = 0.01) {
  if (!vector) return vector;

  return {
    x: deadZone(vector.x, threshold),
    y: deadZone(vector.y, threshold),
    z: deadZone(vector.z || 0, threshold),
  };
}

/**
 * Clamp value within range
 */
export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Smooth scaling with limits
 * @param {number} targetScale - Target scale value
 * @param {number} currentScale - Current scale value
 * @param {number} speed - Smoothing speed (0-1)
 * @param {number} minScale - Minimum allowed scale
 * @param {number} maxScale - Maximum allowed scale
 * @returns {number} Smoothed scale value
 */
export function smoothScale(targetScale, currentScale, speed = 0.2, minScale = 0.5, maxScale = 3) {
  const smoothed = lerp(currentScale, targetScale, speed);
  return clampValue(smoothed, minScale, maxScale);
}

/**
 * Smooth angle/rotation with shortest path
 * Handles angle wrapping (0-360 or 0-2π)
 * @param {number} targetAngle - Target angle in radians
 * @param {number} currentAngle - Current angle in radians
 * @param {number} speed - Smoothing speed
 * @returns {number} Smoothed angle
 */
export function smoothAngle(targetAngle, currentAngle, speed = 0.2) {
  // Calculate shortest path between angles
  let diff = targetAngle - currentAngle;
  
  // Normalize to [-π, π]
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  
  return currentAngle + diff * speed;
}

/**
 * Moving average filter (simple version)
 * Stores recent values and returns average
 */
export class MovingAverageFilter {
  constructor(windowSize = 5) {
    this.windowSize = windowSize;
    this.values = [];
  }

  update(value) {
    this.values.push(value);
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }
    return this.getAverage();
  }

  getAverage() {
    if (this.values.length === 0) return 0;
    const sum = this.values.reduce((a, b) => a + b, 0);
    return sum / this.values.length;
  }

  reset() {
    this.values = [];
  }
}

/**
 * Moving average filter for vectors
 */
export class VectorMovingAverageFilter {
  constructor(windowSize = 5) {
    this.windowSize = windowSize;
    this.values = [];
  }

  update(vector) {
    if (!vector) return null;

    this.values.push({ ...vector });
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }
    return this.getAverage();
  }

  getAverage() {
    if (this.values.length === 0) return null;

    let sumX = 0, sumY = 0, sumZ = 0;
    for (let v of this.values) {
      sumX += v.x;
      sumY += v.y;
      sumZ += v.z || 0;
    }

    return {
      x: sumX / this.values.length,
      y: sumY / this.values.length,
      z: sumZ / this.values.length,
    };
  }

  reset() {
    this.values = [];
  }
}

/**
 * Gesture state machine for debouncing
 * Prevents rapid state changes
 */
export class GestureDebouncer {
  constructor(debounceMs = 100) {
    this.debounceMs = debounceMs;
    this.lastStateChangeTime = 0;
    this.currentState = false;
  }

  update(newState) {
    const now = Date.now();
    
    if (newState !== this.currentState) {
      if (now - this.lastStateChangeTime > this.debounceMs) {
        this.currentState = newState;
        this.lastStateChangeTime = now;
      }
    }
    
    return this.currentState;
  }

  reset() {
    this.currentState = false;
    this.lastStateChangeTime = 0;
  }
}

/**
 * Calculate velocity from position history
 */
export function calculateVelocity(currentPos, previousPos, deltaTime = 0.016) {
  if (!currentPos || !previousPos) return { x: 0, y: 0, z: 0 };

  return {
    x: (currentPos.x - previousPos.x) / deltaTime,
    y: (currentPos.y - previousPos.y) / deltaTime,
    z: ((currentPos.z || 0) - (previousPos.z || 0)) / deltaTime,
  };
}

/**
 * Apply inertia/momentum to movement
 * Gradually slows down motion after hand movement stops
 */
export class Inertia {
  constructor(friction = 0.95) {
    this.velocity = { x: 0, y: 0, z: 0 };
    this.friction = friction;
  }

  update(position, newPosition) {
    if (newPosition && position) {
      this.velocity = {
        x: (newPosition.x - position.x) * 0.5,
        y: (newPosition.y - position.y) * 0.5,
        z: ((newPosition.z || 0) - (position.z || 0)) * 0.5,
      };
    }

    // Apply friction
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.velocity.z *= this.friction;

    return this.velocity;
  }

  getNextPosition(currentPos) {
    if (!currentPos) return currentPos;

    return {
      x: currentPos.x + this.velocity.x,
      y: currentPos.y + this.velocity.y,
      z: (currentPos.z || 0) + this.velocity.z,
    };
  }

  reset() {
    this.velocity = { x: 0, y: 0, z: 0 };
  }
}