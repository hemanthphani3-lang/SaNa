import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene3D from './Scene3D';

const Avatar = ({ viseme = "Neutral", expression = "Neutral", customization = {} }) => {
  return (
    <div className="avatar-wrapper" style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '400px'
    }}>
      <Canvas camera={{ position: [0, 0.2, 3.2], fov: 35 }}>
        <Suspense fallback={null}>
          <Scene3D viseme={viseme} expression={expression} customization={customization} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Avatar;
