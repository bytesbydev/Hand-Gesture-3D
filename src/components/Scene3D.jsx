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
 * Interactive Cube Component with Enhanced Visuals
 */
const InteractiveCube = ({ handsData }) => {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const glowMaterialRef = useRef(null);
  const glowMeshRef = useRef(null);

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
    rotationSpeed: 0,
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
   * Animation loop with enhanced visuals
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

    // Smooth rotation with auto-spin
    state.currentRotation.z = smoothAngle(
      state.targetRotation.z,
      state.currentRotation.z,
      ROTATION_SMOOTH
    );

    // Auto-rotate when not grabbed
    if (!state.isGrabbed) {
      state.rotationSpeed += 0.001;
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.008;
    } else {
      state.rotationSpeed *= 0.95;
    }

    meshRef.current.rotation.z = state.currentRotation.z;

    // Update material color based on grab state
    if (materialRef.current) {
      const targetColor = state.isGrabbed ? 0xff3366 : 0x00ffff;
      const currentColor = new THREE.Color(materialRef.current.color);
      const targetColorObj = new THREE.Color(targetColor);

      currentColor.lerp(targetColorObj, 0.15);
      materialRef.current.color.set(currentColor);

      // Increase emissive when grabbed
      const emissiveIntensity = state.isGrabbed ? 0.8 : 0.2;
      materialRef.current.emissive.setScalar(emissiveIntensity);
    }

    // Update glow mesh
    if (glowMeshRef.current && glowMaterialRef.current) {
      glowMeshRef.current.position.copy(meshRef.current.position);
      glowMeshRef.current.rotation.copy(meshRef.current.rotation);
      glowMeshRef.current.scale.copy(meshRef.current.scale);

      const targetGlowIntensity = state.isGrabbed ? 2 : 0.8;
      glowMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        glowMaterialRef.current.emissiveIntensity || 0.8,
        targetGlowIntensity,
        0.1
      );
    }
  });

  return (
    <>
      {/* Main cube with neon material */}
      <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          ref={materialRef}
          color={0x00ffff}
          emissive={0x00ffff}
          emissiveIntensity={0.2}
          metalness={0.8}
          roughness={0.2}
          wireframe={false}
        />
      </mesh>

      {/* Glow effect mesh */}
      <mesh ref={glowMeshRef} position={[0, 0, 0]}>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshBasicMaterial
          ref={glowMaterialRef}
          color={0x00ffff}
          emissive={0x00ffff}
          emissiveIntensity={0.8}
          transparent
          opacity={0.3}
          wireframe={false}
        />
      </mesh>
    </>
  );
};

/**
 * Lighting and Scene Setup with Enhanced Effects
 */
const SceneContent = ({ handsData }) => {
  return (
    <>
      {/* Cameras and Controls */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
      
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.7} color={0xffffff} />
      
      {/* Key light */}
      <directionalLight
        position={[5, 10, 7]}
        intensity={1.5}
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
      
      {/* Neon accent lights for depth */}
      <pointLight position={[-5, 3, 5]} intensity={1.2} color={0x00ffff} distance={20} decay={1.5} />
      <pointLight position={[5, 3, -5]} intensity={1.2} color={0xff00ff} distance={20} decay={1.5} />
      <pointLight position={[0, -3, 3]} intensity={0.8} color={0x00ff88} distance={15} decay={1.5} />

      {/* Interactive Cube */}
      <InteractiveCube handsData={handsData} />

      {/* Reflective ground plane */}
      <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={0x0a1a3a} metalness={0.4} roughness={0.6} />
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
