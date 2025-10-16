'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SimpleGhostBackground({ className = 'absolute inset-0 -z-10 pointer-events-none' }) {
  const mountRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = null;

    const { clientWidth: width, clientHeight: height } = mountRef.current;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 20;

    // Enhanced renderer with transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true,
      premultipliedAlpha: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false
    });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Canvas styling
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "2";
    renderer.domElement.style.pointerEvents = "auto";
    renderer.domElement.style.background = "transparent";

    // Production parameters
    const params = {
      bodyColor: 0x0f2027,
      glowColor: 0xff4500, // orange
      eyeGlowColor: 0x00ff00, // green
      ghostOpacity: 0.88,
      ghostScale: 2.4,
      emissiveIntensity: 5.8,
      pulseSpeed: 1.6,
      pulseIntensity: 0.6,
      eyeGlowIntensity: 4.5,
      eyeGlowDecay: 0.95,
      eyeGlowResponse: 0.31,
      rimLightIntensity: 1.8,
      followSpeed: 0.075,
      wobbleAmount: 0.35,
      floatSpeed: 1.6,
      movementThreshold: 0.07,
      particleCount: 250,
      particleDecayRate: 0.005,
      particleColor: 0xff4500, // orange
      createParticlesOnlyWhenMoving: true,
      particleCreationRate: 5,
      revealRadius: 43,
      fadeStrength: 2.2,
      baseOpacity: 0.35,
      revealOpacity: 0.0,
      fireflyGlowIntensity: 2.6,
      fireflySpeed: 0.04,
      // new: number of additional ghosts to place around
      extraGhosts: 4,
      gridCols: 5,
      gridRows: 3,
      gridDepth: 0 // world Z plane where extra ghosts will be placed (0 is scene origin)
    };

    // Create bloom-resistant atmosphere
    const atmosphereGeometry = new THREE.PlaneGeometry(300, 300);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ghostPosition: { value: new THREE.Vector3(0, 0, 0) },
        revealRadius: { value: params.revealRadius },
        fadeStrength: { value: params.fadeStrength },
        baseOpacity: { value: params.baseOpacity },
        revealOpacity: { value: params.revealOpacity },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 ghostPosition;
        uniform float revealRadius;
        uniform float fadeStrength;
        uniform float baseOpacity;
        uniform float revealOpacity;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          float dist = distance(vWorldPosition.xy, ghostPosition.xy);
          
          float dynamicRadius = revealRadius + sin(time * 2.0) * 5.0;
          
          float reveal = smoothstep(dynamicRadius * 0.2, dynamicRadius, dist);
          reveal = pow(reveal, fadeStrength);
          
          float opacity = mix(revealOpacity, baseOpacity, reveal);
          
          gl_FragColor = vec4(0.001, 0.001, 0.002, opacity);
        }
      `,
      transparent: true,
      depthWrite: false
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.z = -50;
    atmosphere.renderOrder = -100;
    scene.add(atmosphere);

    // Minimal ambient light
    const ambientLight = new THREE.AmbientLight(0x0a0a2e, 0.08);
    scene.add(ambientLight);

    // Create ghost group (primary)
    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);
    // Keep a list of all ghost groups for multi-ghost behavior
    const ghosts = [ghostGroup];

    // Enhanced ghost geometry
    const ghostGeometry = new THREE.SphereGeometry(2, 40, 40);

    // Create organic wavy bottom
    const positionAttribute = ghostGeometry.getAttribute("position");
    const positions = positionAttribute.array;
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i + 1] < -0.2) {
        const x = positions[i];
        const z = positions[i + 2];
        const noise1 = Math.sin(x * 5) * 0.35;
        const noise2 = Math.cos(z * 4) * 0.25;
        const noise3 = Math.sin((x + z) * 3) * 0.15;
        const combinedNoise = noise1 + noise2 + noise3;
        positions[i + 1] = -2.0 + combinedNoise;
      }
    }
    ghostGeometry.computeVertexNormals();

    // Ghost material
    const ghostMaterial = new THREE.MeshStandardMaterial({
      color: params.bodyColor,
      transparent: true,
      opacity: params.ghostOpacity,
      emissive: params.glowColor,
      emissiveIntensity: params.emissiveIntensity,
      roughness: 0.02,
      metalness: 0.0,
      side: THREE.DoubleSide,
      alphaTest: 0.1
    });

    const ghostBody = new THREE.Mesh(ghostGeometry, ghostMaterial);
    ghostGroup.add(ghostBody);

    // Rim lights
    const rimLight1 = new THREE.DirectionalLight(0x4a90e2, params.rimLightIntensity);
    rimLight1.position.set(-8, 6, -4);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x50e3c2, params.rimLightIntensity * 0.7);
    rimLight2.position.set(8, -4, -6);
    scene.add(rimLight2);

    // Create eyes
    function createEyes() {
      const eyeGroup = new THREE.Group();
      ghostGroup.add(eyeGroup);

      const socketGeometry = new THREE.SphereGeometry(0.45, 16, 16);
      const socketMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: false
      });

      const leftSocket = new THREE.Mesh(socketGeometry, socketMaterial);
      leftSocket.position.set(-0.7, 0.6, 1.9);
      leftSocket.scale.set(1.1, 1.0, 0.6);
      eyeGroup.add(leftSocket);

      const rightSocket = new THREE.Mesh(socketGeometry, socketMaterial);
      rightSocket.position.set(0.7, 0.6, 1.9);
      rightSocket.scale.set(1.1, 1.0, 0.6);
      eyeGroup.add(rightSocket);

      const eyeGeometry = new THREE.SphereGeometry(0.3, 12, 12);

      const leftEyeMaterial = new THREE.MeshBasicMaterial({
        color: params.eyeGlowColor,
        transparent: true,
        opacity: 0
      });
      const leftEye = new THREE.Mesh(eyeGeometry, leftEyeMaterial);
      leftEye.position.set(-0.7, 0.6, 2.0);
      eyeGroup.add(leftEye);

      const rightEyeMaterial = new THREE.MeshBasicMaterial({
        color: params.eyeGlowColor,
        transparent: true,
        opacity: 0
      });
      const rightEye = new THREE.Mesh(eyeGeometry, rightEyeMaterial);
      rightEye.position.set(0.7, 0.6, 2.0);
      eyeGroup.add(rightEye);

      const outerGlowGeometry = new THREE.SphereGeometry(0.525, 12, 12);

      const leftOuterGlowMaterial = new THREE.MeshBasicMaterial({
        color: params.eyeGlowColor,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      });
      const leftOuterGlow = new THREE.Mesh(outerGlowGeometry, leftOuterGlowMaterial);
      leftOuterGlow.position.set(-0.7, 0.6, 1.95);
      eyeGroup.add(leftOuterGlow);

      const rightOuterGlowMaterial = new THREE.MeshBasicMaterial({
        color: params.eyeGlowColor,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      });
      const rightOuterGlow = new THREE.Mesh(outerGlowGeometry, rightOuterGlowMaterial);
      rightOuterGlow.position.set(0.7, 0.6, 1.95);
      eyeGroup.add(rightOuterGlow);

      return {
        leftEye,
        rightEye,
        leftEyeMaterial,
        rightEyeMaterial,
        leftOuterGlow,
        rightOuterGlow,
        leftOuterGlowMaterial,
        rightOuterGlowMaterial
      };
    }

    const eyes = createEyes();

    // Helper to deep-clone materials so colors/opacities are independent per ghost
    const deepClone = (obj) => {
      const clone = obj.clone();
      clone.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
        }
      });
      return clone;
    };

    // Utility: place world position from NDC coordinate (-1..1)
    // Compute visible width/height at the target depth and distribute ghosts in a grid
    const cols = Math.max(1, params.gridCols | 0);
    const rows = Math.max(1, params.gridRows | 0);
    const depthZ = params.gridDepth;
    const viewDistance = camera.position.z - depthZ;
    const halfHeight = Math.tan((camera.fov * Math.PI) / 180 / 2) * viewDistance;
    const halfWidth = halfHeight * camera.aspect;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isCenter = Math.abs(c - (cols - 1) / 2) < 0.5 && Math.abs(r - (rows - 1) / 2) < 0.5;
        if (isCenter) continue; // leave primary ghost in center
        const x = -halfWidth + (c / (cols - 1)) * (halfWidth * 2);
        const y = -halfHeight + (r / (rows - 1)) * (halfHeight * 2);
        const clone = deepClone(ghostGroup);
        clone.position.set(x, y, depthZ - 4 - Math.random() * 4); // spread slightly in Z
        const s = 0.9 + Math.random() * 1.2; // smaller so they don't overlap center
        clone.scale.set(s, s, s);
        scene.add(clone);
        ghosts.push(clone);
      }
    }

    // Create fireflies
    const fireflies = [];
    const fireflyGroup = new THREE.Group();
    scene.add(fireflyGroup);

    function createFireflies() {
      for (let i = 0; i < 20; i++) {
        const fireflyGeometry = new THREE.SphereGeometry(0.02, 2, 2);
        const fireflyMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff44,
          transparent: true,
          opacity: 0.9
        });

        const firefly = new THREE.Mesh(fireflyGeometry, fireflyMaterial);

        firefly.position.set(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20
        );

        const glowGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff88,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        firefly.add(glow);

        const fireflyLight = new THREE.PointLight(0xffff44, 0.8, 3, 2);
        firefly.add(fireflyLight);

        firefly.userData = {
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * params.fireflySpeed,
            (Math.random() - 0.5) * params.fireflySpeed,
            (Math.random() - 0.5) * params.fireflySpeed
          ),
          basePosition: firefly.position.clone(),
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 2 + Math.random() * 3,
          glow: glow,
          glowMaterial: glowMaterial,
          fireflyMaterial: fireflyMaterial,
          light: fireflyLight
        };

        fireflyGroup.add(firefly);
        fireflies.push(firefly);
      }
    }

    createFireflies();

    // Particle system
    const particles = [];
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    const particlePool = [];
    const particleGeometries = [
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.TetrahedronGeometry(0.04, 0),
      new THREE.OctahedronGeometry(0.045, 0)
    ];

    const particleBaseMaterial = new THREE.MeshBasicMaterial({
      color: params.particleColor,
      transparent: true,
      opacity: 0,
      alphaTest: 0.1
    });

    function initParticlePool(count) {
      for (let i = 0; i < count; i++) {
        const geomIndex = Math.floor(Math.random() * particleGeometries.length);
        const geometry = particleGeometries[geomIndex];
        const material = particleBaseMaterial.clone();
        const particle = new THREE.Mesh(geometry, material);
        particle.visible = false;
        particleGroup.add(particle);
        particlePool.push(particle);
      }
    }

    initParticlePool(100);

    function createParticle() {
      let particle;
      if (particlePool.length > 0) {
        particle = particlePool.pop();
        particle.visible = true;
      } else if (particles.length < params.particleCount) {
        const geomIndex = Math.floor(Math.random() * particleGeometries.length);
        const geometry = particleGeometries[geomIndex];
        const material = particleBaseMaterial.clone();
        particle = new THREE.Mesh(geometry, material);
        particleGroup.add(particle);
      } else {
        return null;
      }

      const particleColor = new THREE.Color(params.particleColor);
      const hue = Math.random() * 0.1 - 0.05;
      particleColor.offsetHSL(hue, 0, 0);
      particle.material.color = particleColor;

      particle.position.copy(ghostGroup.position);
      particle.position.z -= 0.8 + Math.random() * 0.6;

      const scatterRange = 3.5;
      particle.position.x += (Math.random() - 0.5) * scatterRange;
      particle.position.y += (Math.random() - 0.5) * scatterRange - 0.8;

      const sizeVariation = 0.6 + Math.random() * 0.7;
      particle.scale.set(sizeVariation, sizeVariation, sizeVariation);

      particle.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      particle.userData.life = 1.0;
      particle.userData.decay = Math.random() * 0.003 + params.particleDecayRate;
      particle.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.015,
        y: (Math.random() - 0.5) * 0.015,
        z: (Math.random() - 0.5) * 0.015
      };
      particle.userData.velocity = {
        x: (Math.random() - 0.5) * 0.012,
        y: (Math.random() - 0.5) * 0.012 - 0.002,
        z: (Math.random() - 0.5) * 0.012 - 0.006
      };

      particle.material.opacity = Math.random() * 0.9;
      particles.push(particle);
      return particle;
    }

    // Mouse tracking
    const mouse = new THREE.Vector2();
    const prevMouse = new THREE.Vector2();
    const mouseSpeed = new THREE.Vector2();
    let lastMouseUpdate = 0;
    let isMouseMoving = false;
    let mouseMovementTimer = null;

    const handleMouseMove = (e) => {
      const now = performance.now();
      if (now - lastMouseUpdate > 16) {
        prevMouse.x = mouse.x;
        prevMouse.y = mouse.y;
        mouse.x = (e.clientX / width) * 2 - 1;
        mouse.y = -(e.clientY / height) * 2 + 1;
        mouseSpeed.x = mouse.x - prevMouse.x;
        mouseSpeed.y = mouse.y - prevMouse.y;
        isMouseMoving = true;

        if (mouseMovementTimer) {
          clearTimeout(mouseMovementTimer);
        }
        mouseMovementTimer = setTimeout(() => {
          isMouseMoving = false;
        }, 80);

        lastMouseUpdate = now;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    let lastParticleTime = 0;
    let time = 0;
    let currentMovement = 0;
    let lastFrameTime = 0;
    let frameCount = 0;

    function animate(timestamp) {
      animationRef.current = requestAnimationFrame(animate);
      
      const deltaTime = timestamp - lastFrameTime;
      lastFrameTime = timestamp;
      if (deltaTime > 100) return;

      const timeIncrement = (deltaTime / 16.67) * 0.01;
      time += timeIncrement;
      frameCount++;

      // Update shader times
      atmosphereMaterial.uniforms.time.value = time;

      // Primary ghost follows the mouse
      const targetX = mouse.x * 11;
      const targetY = mouse.y * 7;
      const prevGhostPosition = ghostGroup.position.clone();

      ghostGroup.position.x += (targetX - ghostGroup.position.x) * params.followSpeed;
      ghostGroup.position.y += (targetY - ghostGroup.position.y) * params.followSpeed;

      // Update atmosphere reveal position (use primary)
      atmosphereMaterial.uniforms.ghostPosition.value.copy(ghostGroup.position);

      const movementAmount = prevGhostPosition.distanceTo(ghostGroup.position);
      currentMovement = currentMovement * params.eyeGlowDecay + movementAmount * (1 - params.eyeGlowDecay);

      // Secondary ghosts drift ambiently
      for (let i = 1; i < ghosts.length; i++) {
        const g = ghosts[i];
        const drift = 0.4 + (i % 3) * 0.2;
        g.position.x += Math.sin(time * (0.3 + i * 0.07)) * 0.01 * drift;
        g.position.y += Math.cos(time * (0.25 + i * 0.05)) * 0.012 * drift;
        g.rotation.y += 0.002;
      }

      // Floating animation
      const float1 = Math.sin(time * params.floatSpeed * 1.5) * 0.03;
      const float2 = Math.cos(time * params.floatSpeed * 0.7) * 0.018;
      const float3 = Math.sin(time * params.floatSpeed * 2.3) * 0.008;
      ghostGroup.position.y += float1 + float2 + float3;

      // Pulsing effects
      const pulse1 = Math.sin(time * params.pulseSpeed) * params.pulseIntensity;
      const pulse2 = Math.cos(time * params.pulseSpeed * 1.4) * params.pulseIntensity * 0.6;
      const breathe = Math.sin(time * 0.6) * 0.12;

      ghostMaterial.emissiveIntensity = params.emissiveIntensity + pulse1 + breathe;

      // Update fireflies
      fireflies.forEach((firefly, index) => {
        const userData = firefly.userData;

        const pulsePhase = time + userData.phase;
        const pulse = Math.sin(pulsePhase * userData.pulseSpeed) * 0.4 + 0.6;

        userData.glowMaterial.opacity = params.fireflyGlowIntensity * 0.4 * pulse;
        userData.fireflyMaterial.opacity = params.fireflyGlowIntensity * 0.9 * pulse;
        userData.light.intensity = params.fireflyGlowIntensity * 0.8 * pulse;

        userData.velocity.x += (Math.random() - 0.5) * 0.001;
        userData.velocity.y += (Math.random() - 0.5) * 0.001;
        userData.velocity.z += (Math.random() - 0.5) * 0.001;

        userData.velocity.clampLength(0, params.fireflySpeed);

        firefly.position.add(userData.velocity);

        if (Math.abs(firefly.position.x) > 30) userData.velocity.x *= -0.5;
        if (Math.abs(firefly.position.y) > 20) userData.velocity.y *= -0.5;
        if (Math.abs(firefly.position.z) > 15) userData.velocity.z *= -0.5;
      });

      // Body animations – apply to all ghosts (primary reacts to mouse)
      const mouseDirection = new THREE.Vector2(
        targetX - ghostGroup.position.x,
        targetY - ghostGroup.position.y
      ).normalize();

      const tiltStrength = 0.1 * params.wobbleAmount;
      const tiltDecay = 0.95;

      const applyBodyAnim = (mesh, phase = 0) => {
        mesh.rotation.z = mesh.rotation.z * tiltDecay + -mouseDirection.x * tiltStrength * (1 - tiltDecay);
        mesh.rotation.x = mesh.rotation.x * tiltDecay + mouseDirection.y * tiltStrength * (1 - tiltDecay);
        mesh.rotation.y = Math.sin(time * 1.4 + phase) * 0.05 * params.wobbleAmount;
      };
      applyBodyAnim(ghostBody, 0);
      for (let i = 1; i < ghosts.length; i++) {
        // Try to find the body mesh (first child of each clone)
        const body = ghosts[i].children.find(c => c.isMesh);
        if (body) applyBodyAnim(body, i * 0.7);
      }

      // Scale variations
      const scaleVariation = 1 + Math.sin(time * 2.1) * 0.025 * params.wobbleAmount + pulse1 * 0.015;
      const scaleBreath = 1 + Math.sin(time * 0.8) * 0.012;
      const finalScale = scaleVariation * scaleBreath;
      ghostBody.scale.set(finalScale, finalScale, finalScale);

      // Eye glow animation
      const normalizedMouseSpeed = Math.sqrt(mouseSpeed.x * mouseSpeed.x + mouseSpeed.y * mouseSpeed.y) * 8;
      const isMoving = currentMovement > params.movementThreshold;
      const targetGlow = isMoving ? 1.0 : 0.0;

      const glowChangeSpeed = isMoving ? params.eyeGlowResponse * 2 : params.eyeGlowResponse;

      const newOpacity = eyes.leftEyeMaterial.opacity + (targetGlow - eyes.leftEyeMaterial.opacity) * glowChangeSpeed;

      eyes.leftEyeMaterial.opacity = newOpacity;
      eyes.rightEyeMaterial.opacity = newOpacity;
      eyes.leftOuterGlowMaterial.opacity = newOpacity * 0.3;
      eyes.rightOuterGlowMaterial.opacity = newOpacity * 0.3;

      // Particle creation
      const shouldCreateParticles = params.createParticlesOnlyWhenMoving
        ? currentMovement > 0.005 && isMouseMoving
        : currentMovement > 0.005;

      if (shouldCreateParticles && timestamp - lastParticleTime > 100) {
        const speedRate = Math.floor(normalizedMouseSpeed * 3);
        const particleRate = Math.min(params.particleCreationRate, Math.max(1, speedRate));
        for (let i = 0; i < particleRate; i++) {
          createParticle();
        }
        lastParticleTime = timestamp;
      }

      // Particle updates
      const particlesToUpdate = Math.min(particles.length, 60);
      for (let i = 0; i < particlesToUpdate; i++) {
        const index = (frameCount + i) % particles.length;
        if (index < particles.length) {
          const particle = particles[index];
          particle.userData.life -= particle.userData.decay;
          particle.material.opacity = particle.userData.life * 0.85;

          if (particle.userData.velocity) {
            particle.position.x += particle.userData.velocity.x;
            particle.position.y += particle.userData.velocity.y;
            particle.position.z += particle.userData.velocity.z;

            const swirl = Math.cos(time * 1.8 + particle.position.y) * 0.0008;
            particle.position.x += swirl;
          }

          if (particle.userData.rotationSpeed) {
            particle.rotation.x += particle.userData.rotationSpeed.x;
            particle.rotation.y += particle.userData.rotationSpeed.y;
            particle.rotation.z += particle.userData.rotationSpeed.z;
          }

          if (particle.userData.life <= 0) {
            particle.visible = false;
            particle.material.opacity = 0;
            particlePool.push(particle);
            particles.splice(index, 1);
            i--;
          }
        }
      }

      // Render
      renderer.render(scene, camera);
    }

    // Initialize mouse position
    const fakeEvent = new MouseEvent("mousemove", {
      clientX: width / 2,
      clientY: height / 2
    });
    window.dispatchEvent(fakeEvent);

    animate(0);

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      if (renderer && mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (scene) {
        scene.clear();
      }
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}
