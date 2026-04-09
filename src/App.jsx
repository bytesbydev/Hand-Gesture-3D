/**
 * App Component
 * Main application combining hand tracking, 3D scene, and HUD
 */

import React, { useState, useCallback, useRef } from 'react';
import HandTracker from './components/HandTracker';
import Scene3D from './components/Scene3D';
import HUD from './components/HUD';
import './App.css';

function App() {
  const [handsData, setHandsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const handsDataRef = useRef([]);

  /**
   * Callback from HandTracker when hands are detected
   */
  const handleHandsDetected = useCallback((hands) => {
    handsDataRef.current = hands;
    setHandsData(hands);
    setIsLoading(false);
  }, []);

  return (
    <div className="app">
      {/* Main container */}
      <div className="main-container">
        {/* Left side: Hand tracking video canvas */}
        <div className="video-section">
          <HandTracker
            onHandsDetected={handleHandsDetected}
            videoWidth={640}
            videoHeight={480}
          />
        </div>

        {/* Right side: 3D scene */}
        <div className="scene-section">
          <Scene3D handsData={handsData} />
        </div>
      </div>

      {/* Overlay HUD */}
      <HUD handsData={handsData} isLoading={isLoading} />

      {/* Info panel */}
      <div className="info-panel">
        <div className="info-header">💡 Tips</div>
        <ul className="info-list">
          <li>Move your hand to move the cube</li>
          <li>Use both hands to scale the cube</li>
          <li>Pinch thumb and index to grab</li>
          <li>Open hand to release</li>
          <li>Rotate hand to rotate cube</li>
        </ul>
      </div>
    </div>
  );
}

export default App;