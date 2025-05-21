import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

// Composant RobotAnimation
export default function AnimatedSphere() {
  // Références pour les éléments du DOM et les objets Three.js
  const canvasContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sphereRef = useRef(null);
  const shadowRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const antennaLeftRef = useRef(null);
  const antennaRightRef = useRef(null);
  const gridGroupRef = useRef(null);

  // Références pour les variables d'animation
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const robotAnimationPhase = useRef(0); // 0: falling, 1: constructing, 2: constructed, 3: deconstructing, 4: deconstructed
  const phaseStartTime = useRef(0);
  const animationFrameId = useRef(null);
  const controlsRef = useRef(null);

  // Constantes physiques et de taille
  const gravity = 9.81;
  const elasticity = 0.5; // Augmenté pour un rebond plus haut
  const groundY = 0;
  const sphereRadius = 1;

  // Initialisation de Three.js et de la scène
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const currentContainer = canvasContainerRef.current;

    // Scène, Caméra, Rendu
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(60, currentContainer.clientWidth / currentContainer.clientHeight, 0.1, 1000);
    cameraRef.current.position.set(0, 5, 10);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;

    currentContainer.appendChild(rendererRef.current.domElement);

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    sceneRef.current.add(pointLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 15, 5);
    spotLight.angle = 0.3;
    spotLight.penumbra = 1;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 50;
    sceneRef.current.add(spotLight);

    // Sphère rebondissante (corps du robot)
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: '#8A2BE2',
      emissive: '#8A2BE2',
      emissiveIntensity: 0.2,
      specular: '#ffffff',
      shininess: 100
    });
    sphereRef.current = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereRef.current.position.y = 5;
    sphereRef.current.castShadow = true;
    sceneRef.current.add(sphereRef.current);

    // --- Parties du robot ---
    const robotMemberMaterial = new THREE.MeshPhongMaterial({
      color: '#6A5ACD',
      specular: '#ffffff',
      shininess: 100
    });
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: 0x00FFFF,
      emissive: 0x00FFFF,
      emissiveIntensity: 0.8,
      specular: 0xffffff,
      shininess: 100
    });

    // Yeux
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    leftEyeRef.current = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEyeRef.current.initialRelativePosition = new THREE.Vector3(-0.3, 0.3, sphereRadius + 0.1);
    leftEyeRef.current.position.set(0, 0, 0);
    leftEyeRef.current.visible = false;
    sphereRef.current.add(leftEyeRef.current);

    rightEyeRef.current = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEyeRef.current.initialRelativePosition = new THREE.Vector3(0.3, 0.3, sphereRadius + 0.1);
    rightEyeRef.current.position.set(0, 0, 0);
    rightEyeRef.current.visible = false;
    sphereRef.current.add(rightEyeRef.current);

    // Antennes
    const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    antennaLeftRef.current = new THREE.Mesh(antennaGeometry, robotMemberMaterial);
    antennaLeftRef.current.initialRelativePosition = new THREE.Vector3(-0.3, sphereRadius + 0.4, 0);
    antennaLeftRef.current.position.set(0, 0, 0);
    antennaLeftRef.current.rotation.z = Math.PI / 8;
    antennaLeftRef.current.visible = false;
    sphereRef.current.add(antennaLeftRef.current);

    antennaRightRef.current = new THREE.Mesh(antennaGeometry, robotMemberMaterial);
    antennaRightRef.current.initialRelativePosition = new THREE.Vector3(0.3, sphereRadius + 0.4, 0);
    antennaRightRef.current.position.set(0, 0, 0);
    antennaRightRef.current.rotation.z = -Math.PI / 8;
    antennaRightRef.current.visible = false;
    sphereRef.current.add(antennaRightRef.current);

    // Ombre au sol (cercle)
    const shadowGeometry = new THREE.CircleGeometry(sphereRadius * 1.5, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    shadowRef.current = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowRef.current.rotation.x = -Math.PI / 2;
    shadowRef.current.position.y = groundY + 0.01;
    shadowRef.current.receiveShadow = true;
    sceneRef.current.add(shadowRef.current);

    // Maille 3D légère (grille)
    gridGroupRef.current = new THREE.Group();
    const gridSize = 20;
    const divisions = 50;
    const color1 = new THREE.Color('#4B0082');
    const color2 = new THREE.Color('#8A2BE2');

    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions - 0.5) * gridSize;
      const verticalLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().lerpColors(color1, color2, i / divisions),
        transparent: true,
        opacity: 0.3
      });
      const verticalLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, -gridSize / 2),
        new THREE.Vector3(x, 0, gridSize / 2)
      ]);
      gridGroupRef.current.add(new THREE.LineSegments(verticalLineGeometry, verticalLineMaterial));

      const horizontalLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().lerpColors(color1, color2, i / divisions),
        transparent: true,
        opacity: 0.3
      });
      const horizontalLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-gridSize / 2, 0, x),
        new THREE.Vector3(gridSize / 2, 0, x)
      ]);
      gridGroupRef.current.add(new THREE.LineSegments(horizontalLineGeometry, horizontalLineMaterial));
    }
    gridGroupRef.current.position.y = -0.05;
    sceneRef.current.add(gridGroupRef.current);

    // Contrôles de la caméra
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableZoom = true;
    controlsRef.current.enablePan = false;
    controlsRef.current.enableRotate = true;
    controlsRef.current.minPolarAngle = 0;
    controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.1;

    // Gestion du redimensionnement du conteneur
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === currentContainer) {
          const { width, height } = entry.contentRect;
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(currentContainer);


    // Fonction de nettoyage
    return () => {
      resizeObserver.disconnect(); // Déconnecter l'observateur
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else if (object.material) {
              object.material.dispose();
            }
          }
        });
      }
      if (currentContainer && rendererRef.current && rendererRef.current.domElement) {
        currentContainer.removeChild(rendererRef.current.domElement);
      }
    };
  }, []); // Le tableau de dépendances vide assure que cela ne s'exécute qu'une fois au montage

  // Boucle d'animation
  useEffect(() => {
    let lastTime = 0;

    const animateLoop = (currentTime) => {
      animationFrameId.current = requestAnimationFrame(animateLoop);

      const delta = (currentTime - lastTime) / 1000 || 0;
      lastTime = currentTime;

      const currentPhase = robotAnimationPhase.current;
      const currentSphere = sphereRef.current;
      const currentShadow = shadowRef.current;
      const currentGridGroup = gridGroupRef.current;
      const currentLeftEye = leftEyeRef.current;
      const currentRightEye = rightEyeRef.current;
      const currentAntennaLeft = antennaLeftRef.current;
      const currentAntennaRight = antennaRightRef.current;

      if (!currentSphere || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // Logique de l'animation du robot
      if (currentPhase === 0) { // Phase 0: La sphère tombe
        velocity.current.y -= gravity * delta;
        currentSphere.position.y += velocity.current.y * delta;

        if (currentSphere.position.y <= groundY + sphereRadius) {
          currentSphere.position.y = groundY + sphereRadius;
          velocity.current.y *= -elasticity;
          velocity.current.x *= 0.99;
          velocity.current.z *= 0.99;

          if (Math.abs(velocity.current.y) < 0.5) {
            velocity.current.y = 0;
            robotAnimationPhase.current = 1;
            phaseStartTime.current = currentTime;
            if (currentLeftEye) currentLeftEye.visible = true;
            if (currentRightEye) currentRightEye.visible = true;
            if (currentAntennaLeft) currentAntennaLeft.visible = true;
            if (currentAntennaRight) currentAntennaRight.visible = true;
          }
        }
      } else if (currentPhase === 1) { // Phase 1: Construction
        const constructionDuration = 1.5;
        const elapsed = (currentTime - phaseStartTime.current) / 1000;
        const progress = Math.min(1, elapsed / constructionDuration);

        if (currentLeftEye) currentLeftEye.position.lerpVectors(new THREE.Vector3(0, 0, 0), currentLeftEye.initialRelativePosition, progress);
        if (currentRightEye) currentRightEye.position.lerpVectors(new THREE.Vector3(0, 0, 0), currentRightEye.initialRelativePosition, progress);
        if (currentAntennaLeft) currentAntennaLeft.position.lerpVectors(new THREE.Vector3(0, 0, 0), currentAntennaLeft.initialRelativePosition, progress);
        if (currentAntennaRight) currentAntennaRight.position.lerpVectors(new THREE.Vector3(0, 0, 0), currentAntennaRight.initialRelativePosition, progress);

        if (progress >= 1) {
          robotAnimationPhase.current = 2;
          phaseStartTime.current = currentTime;
        }

      } else if (currentPhase === 2) { // Phase 2: Robot construit (maintien)
        const holdDuration = 3;
        const elapsed = (currentTime - phaseStartTime.current) / 1000;

        if (currentAntennaLeft && currentAntennaRight) {
          const antennaWobble = Math.sin(currentTime * 0.008) * 0.05;
          currentAntennaLeft.rotation.z = Math.PI / 8 + antennaWobble;
          currentAntennaRight.rotation.z = -Math.PI / 8 - antennaWobble;
        }

        const pulseScale = 1 + Math.sin(currentTime * 0.003) * 0.02;
        currentSphere.scale.set(pulseScale, pulseScale, pulseScale);

        if (elapsed >= holdDuration) {
          robotAnimationPhase.current = 3;
          phaseStartTime.current = currentTime;
        }

      } else if (currentPhase === 3) { // Phase 3: Déconstruction
        const deconstructionDuration = 1.5;
        const elapsed = (currentTime - phaseStartTime.current) / 1000;
        const progress = Math.min(1, elapsed / deconstructionDuration);

        if (currentLeftEye) currentLeftEye.position.lerpVectors(currentLeftEye.initialRelativePosition, new THREE.Vector3(0, 0, 0), progress);
        if (currentRightEye) currentRightEye.position.lerpVectors(currentRightEye.initialRelativePosition, new THREE.Vector3(0, 0, 0), progress);
        if (currentAntennaLeft) currentAntennaLeft.position.lerpVectors(currentAntennaLeft.initialRelativePosition, new THREE.Vector3(0, 0, 0), progress);
        if (currentAntennaRight) currentAntennaRight.position.lerpVectors(currentAntennaRight.initialRelativePosition, new THREE.Vector3(0, 0, 0), progress);

        currentSphere.scale.set(1, 1, 1);

        if (progress >= 1) {
          if (currentLeftEye) currentLeftEye.visible = false;
          if (currentRightEye) currentRightEye.visible = false;
          if (currentAntennaLeft) currentAntennaLeft.visible = false;
          if (currentAntennaRight) currentAntennaRight.visible = false;

          robotAnimationPhase.current = 4;
          phaseStartTime.current = currentTime;
        }

      } else if (currentPhase === 4) { // Phase 4: Déconstruit (maintien)
        const deconstructedHoldDuration = 1;
        const elapsed = (currentTime - phaseStartTime.current) / 1000;

        if (elapsed >= deconstructedHoldDuration) {
          robotAnimationPhase.current = 0;
          phaseStartTime.current = currentTime;
          currentSphere.position.y = 5;
          velocity.current.set(0, 0, 0);
        }
      }

      // Mise à jour de l'ombre
      if (currentShadow) {
        const height = currentSphere.position.y - groundY - sphereRadius;
        const maxShadowScale = 1.5;
        const minShadowOpacity = 0.1;
        const maxSphereHeight = 5;

        const scaleFactor = 1 - Math.min(height / maxSphereHeight, 1) * (1 - 1 / maxShadowScale);
        const opacityFactor = 1 - Math.min(height / maxSphereHeight, 1) * (1 - minShadowOpacity);

        currentShadow.scale.set(scaleFactor, scaleFactor, 1);
        currentShadow.material.opacity = opacityFactor;
        currentShadow.position.set(currentSphere.position.x, groundY + 0.01, currentSphere.position.z);
      }

      // Rotation subtile de la grille
      if (currentGridGroup) {
        currentGridGroup.rotation.y += 0.0005;
        currentGridGroup.rotation.x += 0.0001;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animateLoop(0);

    // Le nettoyage est géré dans le premier useEffect
  }, []);

  // Initialisation de tsparticles
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // console.log("Particules chargées", container);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans">
      {/* Conteneur pour les particules */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: 'transparent',
            },
          },
          fpsLimit: 60,
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: 'push',
              },
              onHover: {
                enable: true,
                mode: 'repulse',
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 4,
              },
              repulse: {
                distance: 100,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: ['#8A2BE2', '#4B0082', '#9932CC', '#6A5ACD'],
            },
            links: {
              color: '#ffffff',
              distance: 150,
              enable: false,
              opacity: 0.4,
              width: 1,
            },
            collisions: {
              enable: false,
            },
            move: {
              direction: 'none',
              enable: true,
              outModes: {
                default: 'bounce',
              },
              random: true,
              speed: 0.5,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.5,
            },
            shape: {
              type: 'circle',
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0"
      />

      {/* Conteneur pour le canvas Three.js */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 z-10"
      ></div>

      {/* Texte d'information */}
      <div className="info-text">
        <p>Faites glisser pour changer la vue.</p>
      </div>
    </div>
  );
}
