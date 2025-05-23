import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

// Composant AnimatedSphere
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
  const robotAnimationPhase = useRef(0); // 0: falling, 1: constructing, 2: constructed (final state)
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
    if (!canvasContainerRef.current) {
      console.error("AnimatedSphere: canvasContainerRef est null au montage.");
      return;
    }

    const currentContainer = canvasContainerRef.current;
    console.log("AnimatedSphere: Dimensions du conteneur au montage:", currentContainer.clientWidth, currentContainer.clientHeight);

    // Scène, Caméra, Rendu
    sceneRef.current = new THREE.Scene();
    // Utilisation d'un fond transparent pour la scène Three.js pour laisser passer le CSS du parent
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;

    currentContainer.appendChild(rendererRef.current.domElement);

    cameraRef.current = new THREE.PerspectiveCamera(60, currentContainer.clientWidth / currentContainer.clientHeight, 0.1, 1000);
    cameraRef.current.position.set(0, 5, 10); // Position initiale de la caméra

    // Lumières améliorées pour un meilleur rendu PBR
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Lumière ambiante plus douce
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Lumière directionnelle pour les ombres
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    sceneRef.current.add(directionalLight);

    const pointLight = new THREE.PointLight(0xa855f7, 1.5, 50); // Lumière ponctuelle violette
    pointLight.position.set(-5, 5, 5);
    sceneRef.current.add(pointLight);

    const spotLight = new THREE.SpotLight(0x6366f1, 1.2, 50, Math.PI * 0.2, 0.5, 2); // Lumière spot bleue
    spotLight.position.set(5, 8, -5);
    spotLight.castShadow = true;
    sceneRef.current.add(spotLight);


    // Sphère rebondissante (corps du robot) - Utilisation de MeshStandardMaterial
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64); // Plus de segments pour une meilleure apparence
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: '#8A2BE2', // Violet plus profond
      emissive: '#8A2BE2',
      emissiveIntensity: 0.3, // Lumière émissive subtile
      roughness: 0.4, // Moins rugueux pour un aspect plus lisse
      metalness: 0.7, // Aspect métallique
      envMapIntensity: 0.5 // Intensité de la carte d'environnement (si présente)
    });
    sphereRef.current = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereRef.current.position.y = 5;
    sphereRef.current.castShadow = true;
    sceneRef.current.add(sphereRef.current);

    // --- Parties du robot ---
    const robotMemberMaterial = new THREE.MeshStandardMaterial({
      color: '#6A5ACD', // Bleu-violet
      roughness: 0.6,
      metalness: 0.3
    });
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FFFF, // Cyan vif
      emissive: 0x00FFFF,
      emissiveIntensity: 1.5, // Forte émission pour les yeux
      roughness: 0.1,
      metalness: 0.8
    });

    // Yeux
    const eyeGeometry = new THREE.SphereGeometry(0.15, 32, 32); // Plus de segments
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
    const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16); // Plus de segments
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

    // Ombre au sol (cercle) - Matériau plus doux pour l'ombre
    const shadowGeometry = new THREE.CircleGeometry(sphereRadius * 1.5, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4, // Opacité légèrement augmentée
      side: THREE.DoubleSide
    });
    shadowRef.current = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowRef.current.rotation.x = -Math.PI / 2;
    shadowRef.current.position.y = groundY + 0.01;
    shadowRef.current.receiveShadow = true;
    sceneRef.current.add(shadowRef.current);

    // Maille 3D légère (grille) - Améliorée
    gridGroupRef.current = new THREE.Group();
    const gridSize = 20;
    const divisions = 50;
    const gridColor1 = new THREE.Color('#4B0082'); // Violet foncé
    const gridColor2 = new THREE.Color('#8A2BE2'); // Violet clair

    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions - 0.5) * gridSize;
      const verticalLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().lerpColors(gridColor1, gridColor2, i / divisions),
        transparent: true,
        opacity: 0.2 // Opacité plus faible pour un look plus subtil
      });
      const verticalLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, -gridSize / 2),
        new THREE.Vector3(x, 0, gridSize / 2)
      ]);
      gridGroupRef.current.add(new THREE.LineSegments(verticalLineGeometry, verticalLineMaterial));

      const horizontalLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color().lerpColors(gridColor1, gridColor2, i / divisions),
        transparent: true,
        opacity: 0.2
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
    controlsRef.current.dampingFactor = 0.05; // Ajout d'un facteur d'amortissement pour un mouvement plus fluide
    controlsRef.current.enableDamping = true; // Active l'amortissement

    // Gestion du redimensionnement du conteneur
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === currentContainer) {
          const { width, height } = entry.contentRect;
          console.log("AnimatedSphere: Conteneur redimensionné à:", width, height);
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
            robotAnimationPhase.current = 1; // Passe à la phase de construction
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
          robotAnimationPhase.current = 2; // Passe à la phase construite (état final)
          phaseStartTime.current = currentTime;
        }

      } else if (currentPhase === 2) { // Phase 2: Robot construit (état final, maintien)
        // Le robot reste construit indéfiniment ici.
        // La logique de déconstruction et de réinitialisation est supprimée.

        if (currentAntennaLeft && currentAntennaRight) {
          const antennaWobble = Math.sin(currentTime * 0.008) * 0.05;
          currentAntennaLeft.rotation.z = Math.PI / 8 + antennaWobble;
          currentAntennaRight.rotation.z = -Math.PI / 8 - antennaWobble;
        }

        const pulseScale = 1 + Math.sin(currentTime * 0.003) * 0.02;
        currentSphere.scale.set(pulseScale, pulseScale, pulseScale);

        // Pulsation des yeux
        if (currentLeftEye && currentRightEye) {
          const eyePulse = 1 + Math.sin(currentTime * 0.005) * 0.1;
          currentLeftEye.scale.set(eyePulse, eyePulse, eyePulse);
          currentRightEye.scale.set(eyePulse, eyePulse, eyePulse);
        }
        // Il n'y a plus de transition vers la phase 3 (déconstruction)
        // if (elapsed >= holdDuration) { ... }
      }
      // Les phases 3 et 4 ne seront plus atteintes
      // else if (currentPhase === 3) { ... }
      // else if (currentPhase === 4) { ... }

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
        controlsRef.current.update(); // Important pour l'amortissement
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
    // La div racine prend toute la hauteur de l'écran pour l'animation de fond
    <div className="relative w-full h-screen overflow-hidden font-sans bg-gradient-to-br from-[#030014] to-[#1a0033]">
      {/* Conteneur pour les particules */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: 'transparent', // Transparent pour laisser passer le dégradé du parent
            },
          },
          fpsLimit: 60,
          interactivity: {
            events: {
              onClick: {
                enable: false, // Désactivé pour ne pas bloquer les clics
                mode: 'push',
              },
              onHover: {
                enable: false, // Désactivé pour ne pas bloquer les survols
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
              value: ['#8A2BE2', '#4B0082', '#9932CC', '#6A5ACD', '#FFFFFF'], // Ajout de blanc
            },
            links: {
              color: '#ffffff',
              distance: 150,
              enable: false, // Pas de liens pour un look plus épuré
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
              value: 100, // Plus de particules
            },
            opacity: {
              value: 0.6, // Opacité légèrement augmentée
            },
            shape: {
              type: 'circle',
            },
            size: {
              value: { min: 1, max: 2 }, // Particules plus petites
            },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0 pointer-events-none" // Maintenu pour les particules
      />

      {/* Conteneur pour le canvas Three.js */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 z-10" // Permet l'interaction avec OrbitControls
      ></div>

      {/* Texte d'information stylisé */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-300 text-sm md:text-base bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 z-20">
        <p>Faites glisser pour changer la vue.</p>
      </div>
    </div>
  );
}
