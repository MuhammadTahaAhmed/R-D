'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { RPM_CONFIG } from '../config/rpm';

// 3D Avatar Model Component
function AvatarModel({ avatarUrl, ...props }) {
  const { scene } = useGLTF(avatarUrl);
  const modelRef = useRef();

  // Add subtle animation
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      {...props}
      scale={[1, 1, 1]}
      position={[0, -1, 0]}
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
  enableEnvironment = true 
}) {
  if (!avatarUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <p className="text-gray-500">No avatar URL provided</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <Suspense fallback={<AvatarLoading />}>
          <AvatarModel avatarUrl={avatarUrl} />
          
          {enableEnvironment && (
            <Environment preset="studio" />
          )}
          
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
        </Suspense>
        
        {enableControls && <OrbitControls enablePan={false} />}
      </Canvas>
    </div>
  );
}
