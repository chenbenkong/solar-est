import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SolarSystemScene } from './three/SolarSystemScene';
import { ControlPanel } from './components/ControlPanel';
import { PlanetInfo } from './components/PlanetInfo';
import { StatusDisplay } from './components/StatusDisplay';
import { PlanetLabels } from './components/PlanetLabels';
import { sunInfo, moonInfo } from './data/planetData';
import './styles/index.css';

export default function App() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const audioRef = useRef(null);
  
  const [isPaused, setIsPaused] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const [globalScale, setGlobalScale] = useState(1.0);
  const [selectedCelestial, setSelectedCelestial] = useState(null);
  const [planetPositions, setPlanetPositions] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new SolarSystemScene(containerRef.current);
    scene.init();
    sceneRef.current = scene;

    scene.onPlanetClick = (planet) => {
      setSelectedCelestial({
        name: planet.name,
        realDiameter: planet.realDiameter,
        realDistance: planet.realDistance,
        orbitPeriod: planet.orbitPeriod,
        rotationPeriod: planet.rotationPeriod,
        temperature: planet.temperature,
        moons: planet.moons,
        atmosphere: planet.atmosphere
      });
    };

    scene.onSunClick = () => {
      setSelectedCelestial(sunInfo);
    };

    scene.onMoonClick = () => {
      setSelectedCelestial(moonInfo);
    };

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    
    const intervalId = setInterval(() => {
      if (sceneRef.current) {
        const positions = sceneRef.current.getPlanetScreenPositions();
        setPlanetPositions(positions);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => {
      const newValue = !prev;
      if (sceneRef.current) {
        sceneRef.current.setPaused(newValue);
      }
      return newValue;
    });
  }, []);

  const handleSpeedChange = useCallback((speed) => {
    setTimeSpeed(speed);
    if (sceneRef.current) {
      sceneRef.current.setTimeSpeed(speed);
    }
  }, []);

  const handleZoomChange = useCallback((scale) => {
    setGlobalScale(scale);
    if (sceneRef.current) {
      sceneRef.current.setGlobalScale(scale);
    }
  }, []);

  const handleToggleOrbits = useCallback(() => {
    setShowOrbits(prev => {
      const newValue = !prev;
      if (sceneRef.current) {
        sceneRef.current.setShowOrbits(newValue);
      }
      return newValue;
    });
  }, []);

  const handleToggleStars = useCallback(() => {
    setShowStars(prev => {
      const newValue = !prev;
      if (sceneRef.current) {
        sceneRef.current.setShowStars(newValue);
      }
      return newValue;
    });
  }, []);

  const handleToggleNames = useCallback(() => {
    setShowNames(prev => {
      const newValue = !prev;
      if (sceneRef.current) {
        sceneRef.current.setShowNames(newValue);
      }
      return newValue;
    });
  }, []);

  const handleResetView = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.resetView();
    }
    setSelectedCelestial(null);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setSelectedCelestial(null);
  }, []);

  const handleCancelTracking = useCallback(() => {
    setSelectedCelestial(null);
    if (sceneRef.current) {
      sceneRef.current.cancelTracking();
    }
  }, []);

  const handleToggleMusic = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      audioRef.current.loop = true;
    }

    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleTogglePause();
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        const newSpeed = Math.min(timeSpeed + 0.5, 10);
        handleSpeedChange(newSpeed);
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        const newSpeed = Math.max(timeSpeed - 0.5, 0.1);
        handleSpeedChange(newSpeed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, handleSpeedChange, timeSpeed]);

  return (
    <div className="app">
      <div ref={containerRef} className="canvas-container" />
      
      <StatusDisplay 
        zoomLevel={globalScale}
        speedLevel={timeSpeed}
      />
      
      <PlanetLabels positions={planetPositions} />
      
      <PlanetInfo
        celestial={selectedCelestial}
        onClose={handleCloseInfo}
        onCancelTracking={handleCancelTracking}
      />
      
      <ControlPanel
        isPaused={isPaused}
        timeSpeed={timeSpeed}
        showOrbits={showOrbits}
        showStars={showStars}
        showNames={showNames}
        globalScale={globalScale}
        isMusicPlaying={isMusicPlaying}
        onTogglePause={handleTogglePause}
        onSpeedChange={handleSpeedChange}
        onZoomChange={handleZoomChange}
        onToggleOrbits={handleToggleOrbits}
        onToggleStars={handleToggleStars}
        onToggleNames={handleToggleNames}
        onResetView={handleResetView}
        onToggleMusic={handleToggleMusic}
      />
    </div>
  );
}
