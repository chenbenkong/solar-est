import React from 'react';

export function PlanetInfo({ celestial, onClose, onCancelTracking }) {
  if (!celestial) return null;

  return (
    <div className="planet-info visible">
      <h2>{celestial.name}</h2>
      <table className="info-table">
        <tbody>
          <tr>
            <th>直径</th>
            <td>{celestial.realDiameter || '-'}</td>
          </tr>
          <tr>
            <th>与太阳距离</th>
            <td>{celestial.realDistance || '-'}</td>
          </tr>
          <tr>
            <th>公转周期</th>
            <td>{celestial.orbitPeriod || '-'}</td>
          </tr>
          <tr>
            <th>自转周期</th>
            <td>{celestial.rotationPeriod || '-'}</td>
          </tr>
          <tr>
            <th>表面温度</th>
            <td>{celestial.temperature || '-'}</td>
          </tr>
          <tr>
            <th>卫星数量</th>
            <td>{celestial.moons || '-'}</td>
          </tr>
          <tr>
            <th>大气成分</th>
            <td>{celestial.atmosphere || '-'}</td>
          </tr>
        </tbody>
      </table>
      <div className="button-container">
        <button className="close-info-btn" onClick={onClose}>
          关闭信息
        </button>
        <button className="cancel-tracking-btn" onClick={onCancelTracking}>
          取消追踪
        </button>
      </div>
    </div>
  );
}
