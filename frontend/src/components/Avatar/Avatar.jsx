import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene3D from './Scene3D';

const Avatar = ({ viseme = "Neutral", emotion = "Neutral", action = "idle", customization = {} }) => {
  return (
    <div className="avatar-wrapper" style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '400px'
    }}>
      {/* Configure Canvas with alpha: true so the parent div background shows through */}
      <Canvas camera={{ position: [0, 0.2, 3.2], fov: 35 }} gl={{ alpha: true }}>
        <Suspense fallback={null}>
          <Scene3D viseme={viseme} emotion={emotion} action={action} customization={customization} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Avatar;
