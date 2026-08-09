import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070913, 0.015);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Cybernetic Grid Plane
    const gridHelper = new THREE.GridHelper(120, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // 3D Particles
    const particlesCount = 400;
    const posArray = new Float32Array(particlesCount * 3);
    const scaleArray = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 80;
      posArray[i + 1] = Math.random() * 40 - 5;
      posArray[i + 2] = (Math.random() - 0.5) * 80;
      scaleArray[i / 3] = Math.random() * 2 + 0.5;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.4,
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);

    // 3D Floating AI Wireframe Nodes
    const nodeGeometry = new THREE.IcosahedronGeometry(3, 1);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });

    const node1 = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node1.position.set(-20, 8, -10);
    scene.add(node1);

    const node2 = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node2.position.set(22, 12, -15);
    scene.add(node2);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera sway based on mouse
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 3 + 15 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Rotate nodes & grid
      node1.rotation.x = elapsedTime * 0.3;
      node1.rotation.y = elapsedTime * 0.5;

      node2.rotation.x = -elapsedTime * 0.2;
      node2.rotation.y = elapsedTime * 0.4;

      particleMesh.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.85 }}
    />
  );
}
