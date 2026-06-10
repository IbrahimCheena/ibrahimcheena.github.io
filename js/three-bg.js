/* ============================================================
   CYBERPUNK CITY GRID — Phase 1: WebGL background scene
   Full-viewport Three.js canvas fixed behind the page:
   - drifting icosahedrons / octahedrons with #00FF41 glow
   - additive particle field
   - endless-scrolling city grid floor
   - mouse parallax on the camera
   ============================================================ */

import * as THREE from 'three';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = window.matchMedia('(max-width: 767px)').matches;

const ACCENT = 0x00ff41;
const BG = 0x050508;

if (!REDUCED_MOTION) init();

function init() {
  const container = document.createElement('div');
  container.id = 'webgl-bg';
  document.body.prepend(container);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.04);

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0.5, 11);

  const renderer = new THREE.WebGLRenderer({
    antialias: !IS_MOBILE,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(ACCENT, 0.3));
  const keyLight = new THREE.PointLight(ACCENT, 40, 50);
  keyLight.position.set(5, 7, 8);
  scene.add(keyLight);

  // shared geometries + materials (created once, disposed on pagehide)
  const geometries = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0)
  ];
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x0a1f10,
    emissive: ACCENT,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.25,
    roughness: 0.3,
    metalness: 0.6,
    flatShading: true
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: ACCENT,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });

  const shapes = [];
  const SHAPE_COUNT = IS_MOBILE ? 6 : 14;
  for (let i = 0; i < SHAPE_COUNT; i++) {
    const geo = geometries[i % geometries.length];
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, solidMat));
    group.add(new THREE.Mesh(geo, wireMat));
    group.scale.setScalar(0.3 + Math.random() * 0.9);
    group.position.set(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 12,
      -2 - Math.random() * 14
    );
    group.userData = {
      spinX: (Math.random() - 0.5) * 0.008,
      spinY: (Math.random() - 0.5) * 0.01,
      floatAmp: 0.4 + Math.random() * 0.8,
      floatSpeed: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      baseY: group.position.y
    };
    scene.add(group);
    shapes.push(group);
  }

  // particle field
  const PARTICLES = IS_MOBILE ? 350 : 1600;
  const positions = new Float32Array(PARTICLES * 3);
  for (let i = 0; i < PARTICLES; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: ACCENT,
    size: 0.05,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // city grid floor crawling toward the camera
  const grid = new THREE.GridHelper(80, 80, ACCENT, ACCENT);
  grid.material.transparent = true;
  grid.material.opacity = 0.13;
  grid.material.depthWrite = false;
  grid.position.y = -6;
  scene.add(grid);

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();

    for (const g of shapes) {
      g.rotation.x += g.userData.spinX;
      g.rotation.y += g.userData.spinY;
      g.position.y = g.userData.baseY +
        Math.sin(t * g.userData.floatSpeed + g.userData.phase) * g.userData.floatAmp;
    }

    particles.rotation.y = t * 0.02;
    grid.position.z = (t * 0.6) % 1; // cell size is 1: seamless endless crawl

    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (0.5 - mouse.y * 0.8 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  });

  addEventListener('pagehide', () => {
    renderer.setAnimationLoop(null);
    geometries.forEach((g) => g.dispose());
    solidMat.dispose();
    wireMat.dispose();
    particleGeo.dispose();
    particleMat.dispose();
    grid.geometry.dispose();
    grid.material.dispose();
    renderer.dispose();
  }, { once: true });
}
