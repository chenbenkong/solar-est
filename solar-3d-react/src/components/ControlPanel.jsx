import React from 'react';

export function ControlPanel({
  isPaused,
  timeSpeed,
  showOrbits,
  showStars,
  showNames,
  globalScale,
  isMusicPlaying,
  onTogglePause,
  onSpeedChange,
  onZoomChange,
  onToggleOrbits,
  onToggleStars,
  onToggleNames,
  onResetView,
  onToggleMusic
}) {
  return (
    <div className="controls">
      <div className="slider-container">
        <label htmlFor="speedControl">速度: </label>
        <input
          type="range"
          id="speedControl"
          min="0"
          max="10"
          step="0.1"
          value={timeSpeed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="slider-container">
        <label htmlFor="zoomControl">整体缩放: </label>
        <input
          type="range"
          id="zoomControl"
          min="0.5"
          max="3.0"
          step="0.1"
          value={globalScale}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        />
      </div>
      <button onClick={onTogglePause}>
        {isPaused ? '播放' : '暂停'}
      </button>
      <button onClick={onResetView}>
        重置视图
      </button>
      <button onClick={onToggleOrbits}>
        {showOrbits ? '隐藏轨道' : '显示轨道'}
      </button>
      <button onClick={onToggleStars}>
        {showStars ? '隐藏星空' : '显示星空'}
      </button>
      <button onClick={onToggleMusic}>
        {isMusicPlaying ? '停止音乐' : '播放音乐'}
      </button>
      <button onClick={onToggleNames}>
        {showNames ? '隐藏名称' : '显示名称'}
      </button>
    </div>
  );
}
