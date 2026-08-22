import React, { useEffect, useRef, useState, useCallback, Component } from 'react';
import { SolarSystemScene } from './three/SolarSystemScene';
import { ControlPanel } from './components/ControlPanel';
import { PlanetInfo } from './components/PlanetInfo';
import { StatusDisplay } from './components/StatusDisplay';
import { PlanetLabels } from './components/PlanetLabels';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { sunInfo, moonInfo } from './data/planetData';
import './styles/index.css';

// 错误边界：捕获子组件渲染期异常，避免整页空白（黑屏）且无提示
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[solar] 组件渲染异常：', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error">
          <h2>页面出错了</h2>
          <pre>{String(this.state.error && this.state.error.stack || this.state.error)}</pre>
          <p>请把上面这段报错发给我，我来修。</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const audioRef = useRef(null);

  const [isPaused, setIsPaused] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [globalScale, setGlobalScale] = useState(1.0);
  const [selectedCelestial, setSelectedCelestial] = useState(null);
  const [planetPositions, setPlanetPositions] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [bloom, setBloom] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [fatalError, setFatalError] = useState(null);

  // 全局捕获未被 React 边界兜住的运行时错误，直接显示在页面上
  useEffect(() => {
    const onError = (e) => setFatalError((prev) => prev || (e.error ? (e.error.stack || e.error.message) : e.message));
    const onReject = (e) => setFatalError((prev) => prev || (e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) : '未知异步错误'));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new SolarSystemScene(containerRef.current);
    scene.init();
    sceneRef.current = scene;
    scene.onLoaded = () => setLoaded(true);

    scene.onPlanetClick = (planet) => {
      setSelectedCelestial({
        name: planet.name,
        color: planet.colorHex,
        type: planet.type,
        fact: planet.fact,
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

  // 兜底：即便个别贴图加载异常，也在 6 秒后强制关闭加载页
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 6000);
    return () => clearTimeout(t);
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

  const handleToggleBloom = useCallback(() => {
    setBloom(prev => {
      const newValue = !prev;
      if (sceneRef.current) {
        sceneRef.current.setBloom(newValue);
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
    <ErrorBoundary>
      {fatalError && (
        <div className="fatal-error">
          <h2>页面运行时出错</h2>
          <pre>{String(fatalError)}</pre>
          <p>请把上面这段报错发给我，我来定位修复。</p>
        </div>
      )}
      <div className="app">
      <LoadingScreen visible={!loaded} progress={loaded ? 100 : 35} />
      <Header zoomLevel={globalScale} speedLevel={timeSpeed} isPaused={isPaused} />

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
        showBloom={bloom}
        globalScale={globalScale}
        isMusicPlaying={isMusicPlaying}
        onTogglePause={handleTogglePause}
        onSpeedChange={handleSpeedChange}
        onZoomChange={handleZoomChange}
        onToggleOrbits={handleToggleOrbits}
        onToggleStars={handleToggleStars}
        onToggleNames={handleToggleNames}
        onToggleBloom={handleToggleBloom}
        onResetView={handleResetView}
        onToggleMusic={handleToggleMusic}
      />
      </div>
    </ErrorBoundary>
  );
}
