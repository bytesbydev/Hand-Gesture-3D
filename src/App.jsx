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
  const [stats, setStats] = useState({
    likes: 2500,
    comments: 1200,
    shares: 450,
    sessionTime: 0
  });
  const handsDataRef = useRef([]);
  const sessionStartRef = useRef(Date.now());

  /**
   * Callback from HandTracker when hands are detected
   */
  const handleHandsDetected = useCallback((hands) => {
    handsDataRef.current = hands;
    setHandsData(hands);
    setIsLoading(false);
  }, []);

  // Update session time
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        sessionTime: Math.floor((Date.now() - sessionStartRef.current) / 1000)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

        {/* Right side: Scene and Stats */}
        <div className="right-section">
          <div className="scene-section">
            <Scene3D handsData={handsData} />
          </div>

          {/* Engagement Stats Sidebar */}
          <div className="stats-sidebar">
            <div className="stat-item">
              <div className="stat-icon">❤️</div>
              <div className="stat-label">Likes</div>
              <div className="stat-value">{stats.likes.toLocaleString()}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">💬</div>
              <div className="stat-label">Comments</div>
              <div className="stat-value">{stats.comments.toLocaleString()}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">📤</div>
              <div className="stat-label">Shares</div>
              <div className="stat-value">{stats.shares.toLocaleString()}</div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">⏱️</div>
              <div className="stat-label">Session</div>
              <div className="stat-value">{formatTime(stats.sessionTime)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay HUD */}
      <HUD handsData={handsData} isLoading={isLoading} />
    </div>
  );
}

export default App;
