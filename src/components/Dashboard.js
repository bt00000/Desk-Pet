import React from 'react';
import Spline from '@splinetool/react-spline';
import '../App.css';

export default function Dashboard() {
  const handleLoad = (splineApp) => {
    console.log('Spline loaded!', splineApp);
  };

  const handleMouseDown = (e) => {
    console.log('Object clicked:', e.target.name);
  };

  return (
    <div>
      <Spline
        scene="https://prod.spline.design/oWEwxrzOTStHDWWM/scene.splinecode"
        onLoad={handleLoad}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
