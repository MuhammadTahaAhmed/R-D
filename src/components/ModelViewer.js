'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
// NecropolisBackground merged into main scene

const ModelViewer = forwardRef(({ 
  modelUrl, 
  name = "3D Avatar",
  className="relative w-full h-[80vh] overflow-hidden",
  showControls = true,
  backgroundImageUrl = null,
  backgroundType = 'necropolis',
  enableAnimations = true,
  autoPlayAnimation = true,
  animationSpeed = 1.0,
  enableIdleAnimation = true,
  idleAnimationType = "wave",
  onAnimationTrigger = null
}, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  
  // Interactive controls state
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  
  // Animation state
  const [availableAnimations, setAvailableAnimations] = useState([]);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Refs for immediate state tracking
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastPanPositionRef = useRef({ x: 0, y: 0 });
  
  // Animation refs
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const idleAnimationRef = useRef(null);
  
  // Helper functions for creating animations
  const createHiAnimation = useCallback(() => {
    if (!modelRef.current) return null;
    
    const model = modelRef.current.children[0];
    if (!model) return null;
    
    console.log('Creating hi animation for model:', model);
    
    // Create a simple waving animation
    const hiClip = new THREE.AnimationClip('hi', 2, [
      // Rotate the model for a wave gesture
      new THREE.VectorKeyframeTrack(
        '.rotation[y]',
        [0, 0.5, 1.0, 1.5, 2.0],
        [0, 0.3, 0, -0.3, 0]
      ),
      new THREE.VectorKeyframeTrack(
        '.rotation[x]',
        [0, 0.5, 1.0, 1.5, 2.0],
        [0, 0.1, 0, -0.1, 0]
      ),
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 0.5, 1.0, 1.5, 2.0],
        [0, 0.05, 0, -0.05, 0]
      )
    ]);
    
    return hiClip;
  }, []);
  
  const createJumpAnimation = useCallback(() => {
    if (!modelRef.current) return null;
    
    const model = modelRef.current.children[0];
    if (!model) return null;
    
    console.log('Creating jump animation for model:', model);
    
    // Store the original position to ensure we return to it
    const originalY = model.position.y;
    
    // Create a jump animation with vertical movement and rotation
    const jumpClip = new THREE.AnimationClip('jump', 1.5, [
      // Vertical jump movement - ensure it returns to original position
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 0.3, 0.6, 0.9, 1.2, 1.5],
        [originalY, originalY + 0.8, originalY + 1.2, originalY + 0.8, originalY + 0.2, originalY]
      ),
      // Slight forward lean during jump
      new THREE.VectorKeyframeTrack(
        '.rotation[x]',
        [0, 0.3, 0.6, 0.9, 1.2, 1.5],
        [0, -0.1, -0.2, -0.1, 0.05, 0]
      ),
      // Slight arm movement
      new THREE.VectorKeyframeTrack(
        '.rotation[z]',
        [0, 0.3, 0.6, 0.9, 1.2, 1.5],
        [0, 0.1, 0.2, 0.1, -0.05, 0]
      )
    ]);
    
    return jumpClip;
  }, []);
  
  const createIdleAnimation = useCallback(() => {
    if (!modelRef.current) return null;
    
    const model = modelRef.current.children[0];
    if (!model) return null;
    
    // Create a subtle idle breathing animation using the root model
    const idleClip = new THREE.AnimationClip('idle', 4, [
      new THREE.VectorKeyframeTrack(
        '.scale[x]',
        [0, 1, 2, 3, 4],
        [1, 1.01, 1, 0.99, 1]
      ),
      new THREE.VectorKeyframeTrack(
        '.scale[y]',
        [0, 1, 2, 3, 4],
        [1, 1.01, 1, 0.99, 1]
      ),
      new THREE.VectorKeyframeTrack(
        '.scale[z]',
        [0, 1, 2, 3, 4],
        [1, 1.01, 1, 0.99, 1]
      )
    ]);
    
    return idleClip;
  }, []);
  
  const createWaveAnimation = useCallback(() => {
    if (!modelRef.current) return null;
    
    const model = modelRef.current.children[0];
    if (!model) return null;
    
    // Create a simple wave animation by rotating the arm
    const waveClip = new THREE.AnimationClip('wave', 2, [
      new THREE.VectorKeyframeTrack(
        'mixamorigRightArm.rotation[x]',
        [0, 0.5, 1, 1.5, 2],
        [0, 0.5, 0, -0.5, 0]
      ),
      new THREE.VectorKeyframeTrack(
        'mixamorigRightArm.rotation[y]',
        [0, 0.5, 1, 1.5, 2],
        [0, 0.3, 0, -0.3, 0]
      ),
      new THREE.VectorKeyframeTrack(
        'mixamorigRightArm.rotation[z]',
        [0, 0.5, 1, 1.5, 2],
        [0, 1.5, 0, 1.5, 0]
      )
    ]);
    
    return waveClip;
  }, []);
  
  const createDanceAnimation = useCallback(() => {
    if (!modelRef.current) return null;
    
    const model = modelRef.current.children[0];
    if (!model) return null;
    
    // Create a simple dance animation
    const danceClip = new THREE.AnimationClip('dance', 3, [
      new THREE.VectorKeyframeTrack(
        'mixamorigHips.rotation[y]',
        [0, 0.5, 1, 1.5, 2, 2.5, 3],
        [0, 0.3, 0, -0.3, 0, 0.3, 0]
      ),
      new THREE.VectorKeyframeTrack(
        'mixamorigSpine.rotation[x]',
        [0, 0.5, 1, 1.5, 2, 2.5, 3],
        [0, 0.1, 0, -0.1, 0, 0.1, 0]
      ),
      new THREE.VectorKeyframeTrack(
        'mixamorigLeftArm.rotation[x]',
        [0, 0.5, 1, 1.5, 2, 2.5, 3],
        [0, 0.5, 0, -0.5, 0, 0.5, 0]
      ),
      new THREE.VectorKeyframeTrack(
        'mixamorigRightArm.rotation[x]',
        [0, 0.5, 1, 1.5, 2, 2.5, 3],
        [0, -0.5, 0, 0.5, 0, -0.5, 0]
      )
    ]);
    
    return danceClip;
  }, []);
  
  const startIdleAnimation = useCallback(() => {
    if (!enableIdleAnimation || !mixerRef.current) return;
    
    let idleClip;
    switch (idleAnimationType) {
      case "wave":
        idleClip = createWaveAnimation();
        break;
      case "dance":
        idleClip = createDanceAnimation();
        break;
      default:
        idleClip = createIdleAnimation();
    }
    
    if (idleClip) {
      const action = mixerRef.current.clipAction(idleClip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.setEffectiveWeight(1);
      action.setEffectiveTimeScale(animationSpeed * 0.5); // Slower for idle
      action.play();
      idleAnimationRef.current = action;
      console.log('Started idle animation:', idleAnimationType);
    }
  }, [enableIdleAnimation, idleAnimationType, animationSpeed, createWaveAnimation, createDanceAnimation, createIdleAnimation]);
  
  // Animation control functions
  const playHiAnimation = useCallback(() => {
    console.log('playHiAnimation called');
    console.log('Model ref:', modelRef.current);
    console.log('Mixer ref:', mixerRef.current);
    
    if (!mixerRef.current) {
      console.log('No mixer found, trying to create one');
      if (modelRef.current && modelRef.current.children[0]) {
        const mixer = new THREE.AnimationMixer(modelRef.current.children[0]);
        mixerRef.current = mixer;
        console.log('Created new mixer:', mixer);
      } else {
        console.log('Cannot create mixer - no model found');
        return;
      }
    }
    
    console.log('Stopping current animations');
    // Stop current animations
    mixerRef.current.stopAllAction();
    
    // Create and play hi animation
    const hiClip = createHiAnimation();
    console.log('Created hi clip:', hiClip);
    if (hiClip) {
      const action = mixerRef.current.clipAction(hiClip);
      console.log('Created action:', action);
      action.setLoop(THREE.LoopOnce);
      action.setEffectiveWeight(1);
      action.setEffectiveTimeScale(animationSpeed);
      action.play();
      
      // Return to idle after animation completes
      action.clampWhenFinished = true;
      
      // Listen for animation finish using mixer events
      const onAnimationFinished = (event) => {
        if (event.action === action) {
          console.log('Hi animation finished, returning to idle');
          
          // Ensure model returns to original position
          if (modelRef.current && modelRef.current.children[0]) {
            const model = modelRef.current.children[0];
            // Reset position to ensure it's not stuck
            model.position.y = 0; // Reset to ground level
            model.rotation.x = 0; // Reset rotation
            model.rotation.z = 0; // Reset rotation
            console.log('Reset model position after hi');
          }
          
          mixerRef.current.removeEventListener('finished', onAnimationFinished);
          startIdleAnimation();
        }
      };
      
      mixerRef.current.addEventListener('finished', onAnimationFinished);
      
      console.log('Playing hi animation');
    } else {
      console.log('Failed to create hi animation clip');
    }
  }, [createHiAnimation, startIdleAnimation, animationSpeed]);
  
  const returnToIdle = useCallback(() => {
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      startIdleAnimation();
      console.log('Returned to idle animation');
    }
  }, [startIdleAnimation]);
  
  const playJumpAnimation = useCallback(() => {
    console.log('playJumpAnimation called');
    console.log('Model ref:', modelRef.current);
    console.log('Mixer ref:', mixerRef.current);
    
    if (!mixerRef.current) {
      console.log('No mixer found, trying to create one');
      if (modelRef.current && modelRef.current.children[0]) {
        const mixer = new THREE.AnimationMixer(modelRef.current.children[0]);
        mixerRef.current = mixer;
        console.log('Created new mixer:', mixer);
      } else {
        console.log('Cannot create mixer - no model found');
        return;
      }
    }
    
    console.log('Stopping current animations');
    // Stop current animations
    mixerRef.current.stopAllAction();
    
    // Create and play jump animation
    const jumpClip = createJumpAnimation();
    console.log('Created jump clip:', jumpClip);
    if (jumpClip) {
      const action = mixerRef.current.clipAction(jumpClip);
      console.log('Created action:', action);
      action.setLoop(THREE.LoopOnce);
      action.setEffectiveWeight(1);
      action.setEffectiveTimeScale(animationSpeed);
      action.play();
      
      // Return to idle after animation completes
      action.clampWhenFinished = true;
      
      // Listen for animation finish using mixer events
      const onAnimationFinished = (event) => {
        if (event.action === action) {
          console.log('Jump animation finished, returning to idle');
          
          // Ensure model returns to original position
          if (modelRef.current && modelRef.current.children[0]) {
            const model = modelRef.current.children[0];
            // Reset position to ensure it's not stuck
            model.position.y = 0; // Reset to ground level
            model.rotation.x = 0; // Reset rotation
            model.rotation.z = 0; // Reset rotation
            console.log('Reset model position after jump');
          }
          
          mixerRef.current.removeEventListener('finished', onAnimationFinished);
          startIdleAnimation();
        }
      };
      
      mixerRef.current.addEventListener('finished', onAnimationFinished);
      
      console.log('Playing jump animation');
    } else {
      console.log('Failed to create jump animation clip');
    }
  }, [createJumpAnimation, startIdleAnimation, animationSpeed]);
  
  const playAnimation = useCallback((animationName) => {
    if (mixerRef.current && availableAnimations.includes(animationName)) {
      // Stop current animation
      if (currentAnimation) {
        mixerRef.current.stopAllAction();
      }
      
      // Find and play the selected animation
      const model = modelRef.current?.children[0];
      const gltf = model?.userData?.gltf;
      if (gltf && gltf.animations) {
        const animation = gltf.animations.find(anim => anim.name === animationName);
        if (animation) {
          const action = mixerRef.current.clipAction(animation);
          action.setEffectiveWeight(1);
          action.setEffectiveTimeScale(animationSpeed);
          action.play();
          setCurrentAnimation(animationName);
          setIsAnimating(true);
          console.log('Playing animation:', animationName);
        }
      }
    }
  }, [mixerRef, availableAnimations, currentAnimation, animationSpeed]);
  
  const stopAnimation = useCallback(() => {
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      setCurrentAnimation(null);
      setIsAnimating(false);
      console.log('Animation stopped');
    }
  }, [mixerRef]);
  
  // Expose animation functions through ref
  useImperativeHandle(ref, () => ({
    playHiAnimation,
    playJumpAnimation,
    returnToIdle,
    playAnimation,
    stopAnimation
  }), [playHiAnimation, playJumpAnimation, returnToIdle, playAnimation, stopAnimation]);

  useEffect(() => {
    if (!modelUrl || !mountRef.current) return;

    // Scene setup with reduced background intensity
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000811, 0.001);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Transparent canvas so external backgrounds (e.g., Ghost) are visible
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Attach renderer canvas to DOM
    // Clear any previous content (e.g., from a prior mount) then append
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Strong lighting for maximum model clarity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(10, 15, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    scene.add(mainLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(-8, 12, 8);
    scene.add(keyLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 8, -15);
    scene.add(backLight);

    const accentLight = new THREE.PointLight(0xffffff, 1.0, 20);
    accentLight.position.set(0, 5, 0);
    scene.add(accentLight);

    // Necropolis background elements (only if backgroundType === 'necropolis')
    const boneAntennas = [];
    const neonTotems = [];
    const floatingMasks = [];
    let particleSystem = null;

    // Create bone antennas with full height coverage
    if (backgroundType === 'necropolis') {
    for (let i = 0; i < 20; i++) {
      const antenna = new THREE.Group();
      const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.3, 8 + Math.random() * 4, 6);
      const boneMaterial = new THREE.MeshPhongMaterial({ color: 0xccccaa, transparent: true, opacity: 0.3, shininess: 30 });
      const shaft = new THREE.Mesh(shaftGeometry, boneMaterial);
      shaft.position.y = 4;
      antenna.add(shaft);

      for (let j = 0; j < 3; j++) {
        const jointGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        const joint = new THREE.Mesh(jointGeometry, boneMaterial);
        joint.position.y = j * 3 + 1;
        antenna.add(joint);
      }

      const receiverGeometry = new THREE.TorusGeometry(1, 0.1, 8, 16);
      const receiverMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffaa, emissive: 0x004433, transparent: true, opacity: 0.4 });
      const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
      receiver.position.y = 8;
      antenna.add(receiver);

      antenna.position.x = (Math.random() - 0.5) * 150;
      antenna.position.z = (Math.random() - 0.5) * 150;
      antenna.position.y = (Math.random() - 0.5) * 20;
      antenna.rotation.y = Math.random() * Math.PI * 2;
      antenna.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(antenna);
      boneAntennas.push(antenna);
    }
    }
    
    // Create neon totems with full height coverage
    const pointLights = [];
    if (backgroundType === 'necropolis') {
    for (let i = 0; i < 15; i++) {
      const totem = new THREE.Group();
      const baseGeometry = new THREE.BoxGeometry(2, 10, 2);
      const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, transparent: true, opacity: 0.3 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 5;
      totem.add(base);

      const colors = [0xff0066, 0x00ffaa, 0x6600ff, 0xffaa00];
      for (let j = 0; j < 4; j++) {
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 8, 16);
        const ringMaterial = new THREE.MeshPhongMaterial({ color: colors[j], emissive: colors[j], emissiveIntensity: 0.2, transparent: true, opacity: 0.4 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = j * 2.5 + 2;
        ring.rotation.x = Math.PI / 2;
        totem.add(ring);
        const light = new THREE.PointLight(colors[j], 0.5, 10);
        light.position.copy(ring.position);
        totem.add(light);
        pointLights.push(light);
      }

      totem.position.x = (Math.random() - 0.5) * 120;
      totem.position.z = (Math.random() - 0.5) * 120;
      totem.position.y = (Math.random() - 0.5) * 15;
      scene.add(totem);
      neonTotems.push(totem);
    }
    }
    
    // Create floating masks
    const maskTexts = [
      'ERROR 404: HUMANITY NOT FOUND',
      'GHOST IN THE MACHINE SPEAKS',
      'DIGITAL TRIBAL COLLECTIVE',
      'NEON SPIRITS GUIDE US',
      'BINARY SHAMANS CALLING',
    ];

    if (backgroundType === 'necropolis') {
    for (let i = 0; i < 12; i++) {
      const mask = new THREE.Group();
      const face = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshPhongMaterial({ color: 0x222222, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
      mask.add(face);

      for (let j = 0; j < 2; j++) {
        const eye = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.4, 8), new THREE.MeshPhongMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 0.3, transparent: true, opacity: 0.8 }));
        eye.position.x = j === 0 ? -0.6 : 0.6;
        eye.position.y = 0.5;
        mask.add(eye);
      }

      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#00ffaa';
      ctx.font = '24px Courier';
      ctx.textAlign = 'center';
      ctx.fillText(maskTexts[i % maskTexts.length], 256, 64);
      const textTexture = new THREE.CanvasTexture(canvas);
      const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, opacity: 0.8 }));
      textMesh.position.y = -3;
      mask.add(textMesh);

      mask.position.x = (Math.random() - 0.5) * 100;
      mask.position.y = (Math.random() - 0.5) * 30;
      mask.position.z = (Math.random() - 0.5) * 100;
      mask.userData = { floatSpeed: 0.01 + Math.random() * 0.02, rotateSpeed: 0.005 + Math.random() * 0.01 };
      scene.add(mask);
      floatingMasks.push(mask);
    }
    }
    
    // Create particle system
    if (backgroundType === 'necropolis') {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.3 + 0.5, 1, 0.5);
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 1, vertexColors: true, transparent: true, opacity: 0.3 });
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    }


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
        
        // No debug primitives to remove
        
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
        
        // Enable shadows and enhance material visibility
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Maximize material visibility and brightness
            if (child.material) {
              child.material.transparent = false;
              child.material.opacity = 1;
              
              // Make materials highly responsive to lighting
              if (child.material.isMeshPhongMaterial || child.material.isMeshLambertMaterial) {
                child.material.shininess = 100;
                child.material.specular = new THREE.Color(0x444444);
                child.material.emissive = new THREE.Color(0x111111);
              }
              
              // Significantly brighten all materials
              if (child.material.color) {
                const currentColor = child.material.color;
                const brightness = currentColor.r + currentColor.g + currentColor.b;
                if (brightness < 0.8) {
                  child.material.color.multiplyScalar(2.5);
                }
                // Add slight emissive glow to make model pop
                if (child.material.emissive) {
                  child.material.emissive.multiplyScalar(0.3);
                }
              }
            }
          }
        });
        
        // Create a rotation group to properly center the model
        const rotationGroup = new THREE.Group();
        rotationGroup.add(model);
        
        // Calculate bounding box for centering
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model bounding box:', box);
        console.log('Model center:', center);
        console.log('Model size:', size);
        
        // Center the model within the rotation group
        model.position.sub(center);
        
        // Position the rotation group at origin to keep model centered
        rotationGroup.position.set(0, 0, 0);
        
        // Add the rotation group to the scene instead of the model directly
        scene.add(rotationGroup);
        
        // Update modelRef to point to the rotation group for rotation
        modelRef.current = rotationGroup;
        
        // Store GLTF data for animation access
        model.userData.gltf = gltf;
        
        // Setup animations if enabled
        if (enableAnimations && gltf.animations && gltf.animations.length > 0) {
          console.log('Setting up animations:', gltf.animations.length, 'animations found');
          
          // Create animation mixer
          const mixer = new AnimationMixer(model);
          mixerRef.current = mixer;
          
          // Store available animations
          const animationNames = gltf.animations.map(anim => anim.name || 'Unnamed Animation');
          setAvailableAnimations(animationNames);
          
          // Auto-play first animation if enabled
          if (autoPlayAnimation && gltf.animations.length > 0) {
            const firstAnimation = gltf.animations[0];
            const action = mixer.clipAction(firstAnimation);
            action.setEffectiveWeight(1);
            action.setEffectiveTimeScale(animationSpeed);
            action.play();
            setCurrentAnimation(firstAnimation.name || 'Animation 1');
            setIsAnimating(true);
            console.log('Auto-playing animation:', firstAnimation.name || 'Animation 1');
          } else {
            // Start idle animation if no auto-play
            setTimeout(() => startIdleAnimation(), 1000);
          }
        } else {
          console.log('No animations found in model, starting idle animation');
          // Start built-in idle animation
          setTimeout(() => startIdleAnimation(), 1000);
        }
        
        // Adjust camera to fit the model properly - ensure full model is visible
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.9; // Bring camera closer to make model appear larger
          
          // Position camera to show the full model including bottom
          camera.position.set(0, 0, cameraZ);
          
          // Keep camera vertically centered on model
          camera.position.y = 0;
        } else {
          // Fallback camera position if model has no size
          camera.position.set(0, 0, 5);
        }
        camera.lookAt(0, 0, 0);
        
        // Scale the model down if it's too large
        if (maxDim > 0) {
          const scaleFactor = Math.min(1, 3 / maxDim); // Base scale from bounds
          rotationGroup.scale.setScalar(scaleFactor * 1.4); // Enlarge on screen
          console.log('Model scaled by factor:', scaleFactor);
        }
        
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

    // Mouse event handlers for interactive controls
    const handleMouseMove = (event) => {
      if (!mountRef.current || !modelRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      
      if (isDraggingRef.current) {
        const deltaX = x - lastMousePositionRef.current.x;
        const deltaY = y - lastMousePositionRef.current.y;
        
        console.log('ModelViewer: Rotating - deltaX:', deltaX, 'deltaY:', deltaY);
        
        // Rotate model based on mouse movement
        // Y rotation (horizontal mouse movement) rotates around Y axis
        modelRef.current.rotation.y += deltaX * 6;
        // X rotation (vertical mouse movement) rotates around X axis
        modelRef.current.rotation.x += deltaY * 6;
        
        // Limit X rotation to prevent flipping
        modelRef.current.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, modelRef.current.rotation.x));
        
        console.log('ModelViewer: New rotation - Y:', modelRef.current.rotation.y, 'X:', modelRef.current.rotation.x);
      }
      
      if (isPanningRef.current) {
        const deltaX = x - lastPanPositionRef.current.x;
        const deltaY = y - lastPanPositionRef.current.y;
        
        console.log('ModelViewer: Panning - deltaX:', deltaX, 'deltaY:', deltaY);
        
        // Pan the model (move it around)
        modelRef.current.position.x += deltaX * 5;
        modelRef.current.position.y -= deltaY * 5; // Invert Y for natural movement
        
        console.log('ModelViewer: New position - X:', modelRef.current.position.x, 'Y:', modelRef.current.position.y);
      }
      
      lastMousePositionRef.current = { x, y };
      lastPanPositionRef.current = { x, y };
      setMousePosition({ x, y });
    };
    
    const handleMouseDown = (event) => {
      event.preventDefault();
      console.log('ModelViewer: Mouse down detected');
      const rect = mountRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      
      // Check if right mouse button or middle mouse button for panning
      if (event.button === 2 || event.button === 1) { // Right click or middle click
        isPanningRef.current = true;
        lastPanPositionRef.current = { x, y };
        console.log('ModelViewer: Panning started');
      } else { // Left click for rotation
        isDraggingRef.current = true;
        lastMousePositionRef.current = { x, y };
        setIsDragging(true);
        setLastMousePosition({ x, y });
        setMousePosition({ x, y });
        console.log('ModelViewer: Rotation started at', { x, y });
      }
    };
    
    const handleMouseUp = (event) => {
      event.preventDefault();
      isDraggingRef.current = false;
      isPanningRef.current = false;
      setIsDragging(false);
    };
    
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
      setIsDragging(false);
    };
    
    
    const handleWheel = (event) => {
      if (camera && modelRef.current) {
        event.preventDefault();
        
        // Get model center position
        const modelPosition = modelRef.current.position;
        const currentDistance = camera.position.distanceTo(modelPosition);
        
        // Adaptive zoom speed based on current distance
        let zoomSpeed = 0.3;
        if (currentDistance < 1) {
          zoomSpeed = 0.1; // Slower zoom when very close
        } else if (currentDistance > 10) {
          zoomSpeed = 0.8; // Faster zoom when far away
        }
        
        const zoomDirection = event.deltaY > 0 ? 1 : -1;
        
        // Calculate direction from camera to model
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, modelPosition).normalize();
        
        // Move camera along this direction
        const zoomAmount = zoomDirection * zoomSpeed;
        camera.position.add(direction.multiplyScalar(zoomAmount));
        
        // Ensure camera always looks at the model center
        camera.lookAt(modelPosition);
        
        // More lenient zoom limits
        const newDistance = camera.position.distanceTo(modelPosition);
        const minDistance = 0.2; // Allow very close zoom
        const maxDistance = 25; // Allow very far zoom
        
        if (newDistance < minDistance) {
          // If too close, move back slightly
          const backDirection = direction.clone().multiplyScalar(-1);
          camera.position.copy(modelPosition).add(backDirection.multiplyScalar(minDistance));
        } else if (newDistance > maxDistance) {
          // If too far, move closer
          camera.position.copy(modelPosition).add(direction.multiplyScalar(maxDistance));
        }
        
        console.log('Camera zoom - distance:', newDistance, 'position:', camera.position);
      }
    };
    
    const handleMouseEnter = () => {
      setIsHovered(true);
    };
    
    const handleMouseLeave = () => {
      setIsHovered(false);
    };
    
    // Animation control functions
    const playAnimation = (animationName) => {
      if (mixerRef.current && availableAnimations.includes(animationName)) {
        // Stop current animation
        if (currentAnimation) {
          mixerRef.current.stopAllAction();
        }
        
        // Find and play the selected animation
        const model = modelRef.current?.children[0];
        const gltf = model?.userData?.gltf;
        if (gltf && gltf.animations) {
          const animation = gltf.animations.find(anim => anim.name === animationName);
          if (animation) {
            const action = mixerRef.current.clipAction(animation);
            action.setEffectiveWeight(1);
            action.setEffectiveTimeScale(animationSpeed);
            action.play();
            setCurrentAnimation(animationName);
            setIsAnimating(true);
            console.log('Playing animation:', animationName);
          }
        }
      }
    };
    
    const stopAnimation = () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        setCurrentAnimation(null);
        setIsAnimating(false);
        console.log('Animation stopped');
      }
    };
    
    const pauseAnimation = () => {
      if (mixerRef.current && currentAnimation) {
        mixerRef.current.stopAllAction();
        setIsAnimating(false);
        console.log('Animation paused');
      }
    };
    
    const resumeAnimation = () => {
      if (mixerRef.current && currentAnimation) {
        playAnimation(currentAnimation);
        console.log('Animation resumed');
      }
    };
    
    // Built-in animation functions for common actions
    const createWaveAnimation = () => {
      if (!modelRef.current) return null;
      
      const model = modelRef.current.children[0];
      if (!model) return null;
      
      // Create a simple wave animation by rotating the arm
      const waveClip = new THREE.AnimationClip('wave', 2, [
        new THREE.VectorKeyframeTrack(
          'mixamorigRightArm.rotation[x]',
          [0, 0.5, 1, 1.5, 2],
          [0, 0.5, 0, -0.5, 0]
        ),
        new THREE.VectorKeyframeTrack(
          'mixamorigRightArm.rotation[y]',
          [0, 0.5, 1, 1.5, 2],
          [0, 0.3, 0, -0.3, 0]
        ),
        new THREE.VectorKeyframeTrack(
          'mixamorigRightArm.rotation[z]',
          [0, 0.5, 1, 1.5, 2],
          [0, 1.5, 0, 1.5, 0]
        )
      ]);
      
      return waveClip;
    };
    
    const createDanceAnimation = () => {
      if (!modelRef.current) return null;
      
      const model = modelRef.current.children[0];
      if (!model) return null;
      
      // Create a simple dance animation
      const danceClip = new THREE.AnimationClip('dance', 3, [
        new THREE.VectorKeyframeTrack(
          'mixamorigHips.rotation[y]',
          [0, 0.5, 1, 1.5, 2, 2.5, 3],
          [0, 0.3, 0, -0.3, 0, 0.3, 0]
        ),
        new THREE.VectorKeyframeTrack(
          'mixamorigSpine.rotation[x]',
          [0, 0.5, 1, 1.5, 2, 2.5, 3],
          [0, 0.1, 0, -0.1, 0, 0.1, 0]
        ),
        new THREE.VectorKeyframeTrack(
          'mixamorigLeftArm.rotation[x]',
          [0, 0.5, 1, 1.5, 2, 2.5, 3],
          [0, 0.5, 0, -0.5, 0, 0.5, 0]
        ),
        new THREE.VectorKeyframeTrack(
          'mixamorigRightArm.rotation[x]',
          [0, 0.5, 1, 1.5, 2, 2.5, 3],
          [0, -0.5, 0, 0.5, 0, -0.5, 0]
        )
      ]);
      
      return danceClip;
    };
    
    const createIdleAnimation = () => {
      if (!modelRef.current) return null;
      
      const model = modelRef.current.children[0];
      if (!model) return null;
      
      // Create a subtle idle breathing animation
      const idleClip = new THREE.AnimationClip('idle', 4, [
        new THREE.VectorKeyframeTrack(
          'mixamorigSpine.rotation[x]',
          [0, 1, 2, 3, 4],
          [0, 0.05, 0, -0.05, 0]
        ),
        new THREE.VectorKeyframeTrack(
          'mixamorigHips.position[y]',
          [0, 1, 2, 3, 4],
          [0, 0.02, 0, -0.02, 0]
        )
      ]);
      
      return idleClip;
    };
    

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      if (backgroundType === 'necropolis') {
        // Animate bone antennas
        boneAntennas.forEach((antenna, index) => {
          const ring = antenna.children[antenna.children.length - 1];
          if (ring) {
            ring.rotation.y += 0.02;
            ring.rotation.x = Math.sin(time + index) * 0.3;
          }
        });
        
        // Animate neon totems
        neonTotems.forEach((totem, index) => {
          totem.children.forEach((child, childIndex) => {
            if (child.material && child.material.emissive) {
              child.material.emissiveIntensity = 0.3 + Math.sin(time * 2 + index + childIndex) * 0.3;
            }
          });
        });
        
        // Animate floating masks
        floatingMasks.forEach((mask) => {
          mask.position.y += Math.sin(time * (mask.userData.floatSpeed || 0.02)) * 0.01;
          mask.rotation.y += mask.userData.rotateSpeed || 0.01;
          mask.rotation.z = Math.sin(time * 0.5) * 0.1;
        });
        
        // Animate particles
        if (particleSystem) {
          particleSystem.rotation.y += 0.001;
          const positions = particleSystem.geometry.attributes.position.array;
          for (let i = 1; i < positions.length; i += 3) positions[i] += Math.sin(time + i) * 0.01;
          particleSystem.geometry.attributes.position.needsUpdate = true;
        }
      }
      
      // Update animation mixer if it exists
      if (mixerRef.current) {
        const delta = clockRef.current.getDelta();
        mixerRef.current.update(delta);
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

    // Add event listeners for interactive controls
    const canvas = renderer.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // Set cursor styles
    canvas.style.cursor = 'grab';
    canvas.style.userSelect = 'none';
    
    // Debug logging
    console.log('ModelViewer: Event listeners attached to canvas');
    console.log('ModelViewer: Model ref:', modelRef.current);

    window.addEventListener('resize', handleResize);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    // Cleanup
    return () => {
      // Remove event listeners
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
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
  }, [modelUrl, showControls, backgroundType]);

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
    <div className={`${className} relative group`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading 3D Model...</p>
          </div>
        </div>
      )}
      
      <div ref={mountRef} className="absolute inset-0 z-10" />
    </div>
  );
});

export default ModelViewer;
