import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const WavesBackground = ({
  color = 0x005588,
  shininess = 30,
  waveHeight = 15,
  waveSpeed = 1,
  zoom = 1,
}) => {
  const mountRef = useRef(null);

  useEffect(() => {
    let frameId;
    let scene, camera, renderer, plane, t = 0;
    const width = (mountRef.current && mountRef.current.clientWidth) || window.innerWidth;
    const height = (mountRef.current && mountRef.current.clientHeight) || window.innerHeight;

    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(35, width / height, 50, 10000);
    const cameraPosition = new THREE.Vector3(240, 200, 390);
    const cameraTarget = new THREE.Vector3(140, -30, 190);
    camera.position.copy(cameraPosition);

    // Lights
    const ambience = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambience);
    const pointLight = new THREE.PointLight(0xffffff, 0.9);
    pointLight.position.set(-100, 250, -100);
    scene.add(pointLight);

    // Plane geometry
    const ww = 100;
    const hh = 80;
    const CELLSIZE = 18;
    const waveNoise = 4;
    const material = new THREE.MeshPhongMaterial({
      color,
      shininess,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const points = [];
    const indices = [];
    const grid = [];

    for (let i = 0; i <= ww; i++) {
      grid[i] = [];
      for (let j = 0; j <= hh; j++) {
        const id = points.length;
        const newVertex = new THREE.Vector3(
          (i - ww * 0.5) * CELLSIZE,
          Math.random() * waveNoise - 10,
          (hh * 0.5 - j) * CELLSIZE
        );
        points.push(newVertex);
        grid[i][j] = id;
      }
    }

    for (let i = 1; i <= ww; i++) {
      for (let j = 1; j <= hh; j++) {
        const d = grid[i][j];
        const b = grid[i][j - 1];
        const c = grid[i - 1][j];
        const a = grid[i - 1][j - 1];
        const flip = Math.random() > 0.5;
        if (flip) {
          indices.push(a, b, c, b, c, d);
        } else {
          indices.push(a, b, d, a, c, d);
        }
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setIndex(indices);
    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Animation
    const oy = new Float32Array(geometry.attributes.position.array.length / 3);
    for (let i = 0; i < oy.length; i++) {
      oy[i] = geometry.attributes.position.array[i * 3 + 1];
    }

    const animate = () => {
      t += 0.02;
      const pos = geometry.attributes.position.array;

      for (let i = 0; i < pos.length; i += 3) {
        const x = pos[i];
        const z = pos[i + 2];
        const baseY = oy[i / 3];
        const s = waveSpeed;
        const crossChop = Math.sqrt(s) * Math.cos(-x - z * 0.7);
        const delta =
          Math.sin((s * t - s * x * 0.025 + s * z * 0.015 + crossChop)) *
          waveHeight;
        pos[i + 1] = baseY + delta * 0.25;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (renderer) renderer.dispose();
      if (mountRef.current && renderer && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [color, shininess, waveHeight, waveSpeed, zoom]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default WavesBackground;
