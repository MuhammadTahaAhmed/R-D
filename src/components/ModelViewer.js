'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function ModelViewer({ 
  modelUrl, 
  name = "3D Avatar",
  className = "w-full h-full min-h-[400px]",
  showControls = true 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    if (!modelUrl || !mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Attach renderer canvas to DOM
    // Clear any previous content (e.g., from a prior mount) then append
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add a test cube to verify Three.js is working
    const testCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    testCube.position.set(0, 0, 0);
    scene.add(testCube);
    console.log('Test cube added to verify Three.js setup');

    // Load the GLB model
    const loader = new GLTFLoader();
    
    // Add CORS support for Cloudinary URLs
    loader.setCrossOrigin('anonymous');
    
    // Add timeout for model loading
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        console.error('Model loading timeout');
        setError('Model loading timed out - the file might be corrupted or too large');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
    
    loader.load(
      modelUrl,
      (gltf) => {
        console.log('GLTF loaded successfully:', gltf);
        const model = gltf.scene;
        modelRef.current = model;
        
        console.log('Model children count:', model.children.length);
        console.log('Model visible:', model.visible);
        console.log('Model position:', model.position);
        console.log('Model scale:', model.scale);
        
        // Remove test cube when model loads
        const testCube = scene.children.find(child => child.geometry && child.geometry.type === 'BoxGeometry');
        if (testCube) {
          scene.remove(testCube);
          console.log('Test cube removed');
        }
        
        // Validate model has content
        if (model.children.length === 0) {
          console.warn('Model has no children - might be empty');
          setError('Model appears to be empty or corrupted');
          setIsLoading(false);
          return;
        }
        
        // Scale and position the model
        model.scale.setScalar(1);
        model.position.set(0, 0, 0);
        
        // Enable shadows and make sure materials are visible
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Ensure materials are properly set
            if (child.material) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
          }
        });
        
        scene.add(model);
        
        // Calculate bounding box for centering
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model bounding box:', box);
        console.log('Model center:', center);
        console.log('Model size:', size);
        
        // Center the model
        model.position.sub(center);
        
        // Adjust camera to fit the model
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 2; // Add more padding
          camera.position.set(0, 0, cameraZ);
        } else {
          // Fallback camera position if model has no size
          camera.position.set(0, 1, 3);
        }
        camera.lookAt(0, 0, 0);
        
        console.log('Camera position:', camera.position);
        console.log('Camera target:', new THREE.Vector3(0, 0, 0));
        
        clearTimeout(loadTimeout);
        setIsLoading(false);
        setModelInfo({
          vertices: model.children.reduce((count, child) => {
            if (child.isMesh) {
              return count + (child.geometry.attributes.position?.count || 0);
            }
            return count;
          }, 0),
          triangles: model.children.reduce((count, child) => {
            if (child.isMesh) {
              return count + (child.geometry.index?.count / 3 || 0);
            }
            return count;
          }, 0),
          size: size
        });
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        console.error('Model URL:', modelUrl);
        clearTimeout(loadTimeout);
        setError('Failed to load 3D model: ' + error.message);
        setIsLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (modelRef.current && showControls) {
        // Auto-rotate the model
        modelRef.current.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (mountRef.current && camera && renderer) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
      // Detach renderer canvas from DOM
      if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (scene) {
        scene.clear();
      }
    };
  }, [modelUrl, showControls]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 border border-red-200 rounded-lg`}>
        <div className="text-center text-red-600">
          <h3 className="font-semibold mb-2">Error Loading 3D Model</h3>
          <p className="text-sm mb-2">{error}</p>
          <p className="text-xs text-gray-500">URL: {modelUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading 3D Model...</p>
          </div>
        </div>
      )}
      
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Overlays removed as requested */}
    </div>
  );
}
