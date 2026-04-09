/**
 * Scene3D Component
 * React Three Fiber scene with interactive cube controlled by hand gestures
 */

import React, { useRef, useEffect, } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, } from '@react-three/drei';
import * as THREE from 'three';
import {
  isPinched,
  getHandCenter,
  normalizeHandPosition,
  getTwoHandScale,
  getHandRotation,
} from '../utils/gestures.js';
import {
  exponentialSmoothVector,
  smoothScale,
  smoothAngle,
  VectorMovingAverageFilter,
} from '../utils/smoothing.js';

/**
 * Interactive Cube Component
 */
const InteractiveCube = ({ handsData }) => {
  const meshRef = useRef(null);
  const materialRef = useRef(null);

  // State for gesture tracking
  const stateRef = useRef({
    isGrabbed: false,
    previousPosition: null,
    targetPosition: { x: 0, y: 0, z: 0 },
    smoothPosition: { x: 0, y: 0, z: 0 },
    targetScale: 1,
    currentScale: 1,
    targetRotation: { x: 0, y: 0, z: 0 },
    currentRotation: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
  });

  // Smoothing filters
  const positionFilterRef = useRef(new VectorMovingAverageFilter(5));
  const scaleRef = useRef({ target: 1, current: 1 });

  // Constants for tuning
  const POSITION_SMOOTH = 0.25;
  const SCALE_SMOOTH = 0.15;
  const ROTATION_SMOOTH = 0.2;
  const BASE_HAND_DISTANCE = 0.3;
  const WORLD_SCALE = 4;

  /**
   * Update cube based on hand data
   */
  useEffect(() => {
    if (!handsData || handsData.length === 0) return;

    const state = stateRef.current;

    // Check if either hand has a pinch gesture (grab)
    const leftHand = handsData.find((h) => h.handedness === 'Left');
    const rightHand = handsData.find((h) => h.handedness === 'Right');

    const leftPinched = leftHand && isPinched(leftHand.landmarks, state.isGrabbed);
    const rightPinched = rightHand && isPinched(rightHand.landmarks, state.isGrabbed);

    state.isGrabbed = leftPinched || rightPinched;

    // Determine which hand to use for movement (prefer pinching hand)
    let controlHand = null;
    if (leftPinched) controlHand = leftHand;
    else if (rightPinched) controlHand = rightHand;
    else if (leftHand) controlHand = leftHand;
    else if (rightHand) controlHand = rightHand;

    // Update position if hand is grabbed or visible
    if (controlHand && controlHand.landmarks) {
      const handCenter = getHandCenter(controlHand.landmarks);

      if (handCenter) {
        // Normalize to world space
        const worldPos = normalizeHandPosition(handCenter, WORLD_SCALE);

        if (worldPos) {
          state.targetPosition = worldPos;

          // Add some inertia/smoothing
          if (!state.previousPosition) {
            state.previousPosition = worldPos;
          }

          // Calculate velocity for inertia effect
          state.velocity = {
            x: (worldPos.x - state.previousPosition.x) * 0.5,
            y: (worldPos.y - state.previousPosition.y) * 0.5,
            z: (worldPos.z - state.previousPosition.z) * 0.5,
          };

          state.previousPosition = worldPos;
        }

        // Update rotation based on hand orientation
        const rotation = getHandRotation(controlHand.landmarks);
        state.targetRotation.z = rotation;
      }
    }

    // Handle two-hand scaling
    if (leftHand && rightHand) {
      const scale = getTwoHandScale(
        leftHand.landmarks,
        rightHand.landmarks,
        BASE_HAND_DISTANCE
      );
      scaleRef.current.target = scale;
    } else {
      scaleRef.current.target = 1;
    }
  }, [handsData]);

  /**
   * Animation loop
   */
  useFrame(() => {
    if (!meshRef.current) return;

    const state = stateRef.current;

    // Smooth position with lerp
    state.smoothPosition = exponentialSmoothVector(
      state.targetPosition,
      state.smoothPosition,
      POSITION_SMOOTH
    );

    // Apply smoothed position (add inertia)
    meshRef.current.position.lerp(
      new THREE.Vector3(
        state.smoothPosition.x + state.velocity.x,
        state.smoothPosition.y + state.velocity.y,
        state.smoothPosition.z + state.velocity.z
      ),
      0.2
    );

    // Dampen velocity over time
    state.velocity.x *= 0.92;
    state.velocity.y *= 0.92;
    state.velocity.z *= 0.92;

    // Smooth scale
    state.currentScale = smoothScale(
      scaleRef.current.target,
      state.currentScale,
      SCALE_SMOOTH,
      0.5,
      3
    );
    meshRef.current.scale.set(state.currentScale, state.currentScale, state.currentScale);

    // Smooth rotation
    state.currentRotation.z = smoothAngle(
      state.targetRotation.z,
      state.currentRotation.z,
      ROTATION_SMOOTH
    );

    meshRef.current.rotation.z = state.currentRotation.z;

    // Update material color based on grab state
    if (materialRef.current) {
      const targetColor = state.isGrabbed ? 0xff6600 : 0x0099ff;
      const currentColor = new THREE.Color(materialRef.current.color);
      const targetColorObj = new THREE.Color(targetColor);

      currentColor.lerp(targetColorObj, 0.15);
      materialRef.current.color.set(currentColor);

      // Increase emissive when grabbed
      const emissiveIntensity = state.isGrabbed ? 0.5 : 0.1;
      materialRef.current.emissive.setScalar(emissiveIntensity * 0.2);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial
        ref={materialRef}
        color={0x0099ff}
        emissive={0x0099ff}
        emissiveIntensity={0.2}
        shininess={100}
        wireframe={false}
      />
    </mesh>
  );
};

/**
 * Lighting and Scene Setup
 */
const SceneContent = ({ handsData }) => {
  return (
    <>
      {/* Cameras and Controls */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} color={0xffffff} />
      <directionalLight
        position={[5, 10, 7]}
        intensity={1.2}
        color={0xffffff}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={15}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Colored accent lights */}
      <pointLight position={[-5, 3, 5]} intensity={0.6} color={0x00ffff} />
      <pointLight position={[5, 3, -5]} intensity={0.6} color={0xff0099} />

      {/* Interactive Cube */}
      <InteractiveCube handsData={handsData} />

      {/* Ground plane (optional) */}
      <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={0x111111} metalness={0.3} roughness={0.8} />
      </mesh>
    </>
  );
};

/**
 * Main Scene3D Component
 */
const Scene3D = ({ handsData }) => {
  return (
    <Canvas
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%)',
      }}
      shadows
      dpr={window.devicePixelRatio}
      performance={{ current: 1 }} // Disable adaptive rendering
    >
      {/* Post-processing and effects could go here */}
      <SceneContent handsData={handsData} />
    </Canvas>
  );
};

export default Scene3D;