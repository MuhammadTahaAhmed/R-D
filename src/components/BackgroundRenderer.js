'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import SimpleGhostBackground from './SimpleGhostBackground';

// Background configurations
const BACKGROUND_CONFIGS = {
  necropolis: {
    name: 'Necropolis',
    fogColor: 0x000811,
    fogDensity: 0.002,
    clearColor: 0x000811,
    ambientLightColor: 0x001122,
    ambientLightIntensity: 0.3,
    spotLightColor: 0x00ffaa,
    spotLightIntensity: 1,
    spotLightDistance: 100,
    spotLightAngle: Math.PI / 4,
    spotLightPenumbra: 0.5,
    spotLightDecay: 2
  },
  ghost: {
    name: 'Ghost',
    fogColor: 0x000000,
    fogDensity: 0.001,
    clearColor: 0x000000,
    ambientLightColor: 0x0a0a2e,
    ambientLightIntensity: 0.08,
    spotLightColor: 0x4a90e2,
    spotLightIntensity: 1.8,
    spotLightDistance: 100,
    spotLightAngle: Math.PI / 4,
    spotLightPenumbra: 0.5,
    spotLightDecay: 2
  }
  // More background configs will be added here
};

export default function BackgroundRenderer({ 
  backgroundType = 'necropolis',
  className = 'absolute inset-0 -z-10 pointer-events-none' 
}) {
  // Handle special background types that use their own components
  if (backgroundType === 'ghost') {
    return <SimpleGhostBackground className={className} />;
  }

  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const config = BACKGROUND_CONFIGS[backgroundType] || BACKGROUND_CONFIGS.necropolis;

    // Core
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);

    const { clientWidth: width, clientHeight: height } = mountRef.current;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 15, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(config.clearColor, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(config.ambientLightColor, config.ambientLightIntensity);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(
      config.spotLightColor, 
      config.spotLightIntensity, 
      config.spotLightDistance, 
      config.spotLightAngle, 
      config.spotLightPenumbra, 
      config.spotLightDecay
    );
    spotLight.position.set(0, 50, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Collections
    const boneAntennas = [];
    const neonTotems = [];
    const floatingMasks = [];
    let particleSystem = null;

    // Bone antennas
    const createBoneAntennas = () => {
      for (let i = 0; i < 14; i++) {
        const antenna = new THREE.Group();
        const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.3, 8 + Math.random() * 4, 6);
        const boneMaterial = new THREE.MeshPhongMaterial({ color: 0xccccaa, transparent: true, opacity: 0.8, shininess: 30 });
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
        const receiverMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffaa, emissive: 0x004433, transparent: true, opacity: 0.7 });
        const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
        receiver.position.y = 8;
        antenna.add(receiver);

        antenna.position.x = (Math.random() - 0.5) * 100;
        antenna.position.z = (Math.random() - 0.5) * 100;
        antenna.rotation.y = Math.random() * Math.PI * 2;
        antenna.rotation.z = (Math.random() - 0.5) * 0.3;
        scene.add(antenna);
        boneAntennas.push(antenna);
      }
    };

    const pointLights = [];
    // Neon totems
    const createNeonTotems = () => {
      for (let i = 0; i < 10; i++) {
        const totem = new THREE.Group();
        const baseGeometry = new THREE.BoxGeometry(2, 10, 2);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, transparent: true, opacity: 0.6 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 5;
        totem.add(base);

        const colors = [0xff0066, 0x00ffaa, 0x6600ff, 0xffaa00];
        for (let j = 0; j < 4; j++) {
          const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 8, 16);
          const ringMaterial = new THREE.MeshPhongMaterial({ color: colors[j], emissive: colors[j], emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.position.y = j * 2.5 + 2;
          ring.rotation.x = Math.PI / 2;
          totem.add(ring);
          const light = new THREE.PointLight(colors[j], 0.5, 10);
          light.position.copy(ring.position);
          totem.add(light);
          pointLights.push(light);
        }

        totem.position.x = (Math.random() - 0.5) * 80;
        totem.position.z = (Math.random() - 0.5) * 80;
        scene.add(totem);
        neonTotems.push(totem);
      }
    };

    const maskTexts = [
      'ERROR 404: HUMANITY NOT FOUND',
      'GHOST IN THE MACHINE SPEAKS',
      'DIGITAL TRIBAL COLLECTIVE',
      'NEON SPIRITS GUIDE US',
      'BINARY SHAMANS CALLING',
    ];

    const createFloatingMasks = () => {
      for (let i = 0; i < 8; i++) {
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

        mask.position.x = (Math.random() - 0.5) * 60;
        mask.position.y = 8 + Math.random() * 10;
        mask.position.z = (Math.random() - 0.5) * 60;
        mask.userData = { floatSpeed: 0.01 + Math.random() * 0.02, rotateSpeed: 0.005 + Math.random() * 0.01 };
        scene.add(mask);
        floatingMasks.push(mask);
      }
    };

    const createParticleSystem = () => {
      const particleCount = 700;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = Math.random() * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.3 + 0.5, 1, 0.5);
        colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({ size: 2, vertexColors: true, transparent: true, opacity: 0.6 });
      particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);
    };

    // Build scene
    createBoneAntennas();
    createNeonTotems();
    createFloatingMasks();
    createParticleSystem();

    // Animate
    const animate = () => {
      const time = Date.now() * 0.001;
      boneAntennas.forEach((antenna, index) => {
        const ring = antenna.children[antenna.children.length - 1];
        if (ring) {
          ring.rotation.y += 0.02;
          ring.rotation.x = Math.sin(time + index) * 0.3;
        }
      });
      neonTotems.forEach((totem, index) => {
        totem.children.forEach((child, childIndex) => {
          if (child.material && child.material.emissive) {
            child.material.emissiveIntensity = 0.3 + Math.sin(time * 2 + index + childIndex) * 0.3;
          }
        });
      });
      floatingMasks.forEach((mask) => {
        mask.position.y += Math.sin(time * (mask.userData.floatSpeed || 0.02)) * 0.01;
        mask.rotation.y += mask.userData.rotateSpeed || 0.01;
        mask.rotation.z = Math.sin(time * 0.5) * 0.1;
      });
      if (particleSystem) {
        particleSystem.rotation.y += 0.001;
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) positions[i] += Math.sin(time + i) * 0.01;
        particleSystem.geometry.attributes.position.needsUpdate = true;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [backgroundType]);

  return <div ref={mountRef} className={className} />;
}
