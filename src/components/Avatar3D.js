'use client';

import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { RPM_CONFIG } from '../config/rpm';

// 3D Avatar Model Component with Interactive Controls
function AvatarModel({ avatarUrl, enableAutoRotate = true, ...props }) {
  const { scene } = useGLTF(avatarUrl);
  const modelRef = useRef();
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  // Enhanced animation with user interaction
  useFrame((state, delta) => {
    if (modelRef.current) {
      // Continuous rotation when not hovered and auto-rotate is enabled
      if (!hovered && enableAutoRotate) {
        modelRef.current.rotation.y += delta * 0.2;
      }
      // Subtle breathing effect
      modelRef.current.scale.setScalar(clicked ? 1.1 : 1.0);
    }
  });

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      {...props}
      scale={clicked ? 1.1 : 1.0}
      position={[0, -1, 0]}
      onClick={(event) => {
        event.stopPropagation();
        click(!clicked);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        hover(true);
      }}
      onPointerOut={(event) => {
        hover(false);
      }}
      style={{ cursor: 'pointer' }}
    />
  );
}

// Loading component
function AvatarLoading() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
}

// Main 3D Avatar Component
export default function Avatar3D({ 
  avatarUrl, 
  className = "w-full h-96",
  enableControls = true,
  enableEnvironment = true,
  autoRotate = false,  // Changed default to false
  enableZoom = true,
  enablePan = false,
  enableModelAutoRotate = false  // New prop to control model rotation
}) {
  if (!avatarUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <p className="text-gray-500">No avatar URL provided</p>
      </div>
    );
  }

  return (
    <div className={`${className} relative group`}>
      
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 50 }}
        // style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        
        <Suspense fallback={<AvatarLoading />}>
          <AvatarModel avatarUrl={avatarUrl} enableAutoRotate={enableModelAutoRotate} />
          
          {enableEnvironment && (
            <Environment preset="studio" />
          )}
          
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />
          <pointLight position={[0, 10, 0]} intensity={0.5} color="#ff6b6b" />
        </Suspense>
        
        {enableControls && (
          <OrbitControls 
            enablePan={enablePan}
            enableZoom={enableZoom}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={10}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
          />
        )}
      </Canvas>
    </div>
  );
}
