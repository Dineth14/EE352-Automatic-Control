/* ============================================================
   Three.js Shared Scene / Camera / Light Setup
   ============================================================ */
export function createScene(container, options = {}) {
  const THREE = window.THREE;
  if (!THREE) {
    console.warn('Three.js not loaded');
    return null;
  }

  const {
    background = 0x060a14,
    alpha = true,
    antialias = true,
    fov = 60,
    near = 0.1,
    far = 1000,
    cameraPos = [0, 0, 5],
    enableControls = true,
    bloom = false
  } = options;

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias, alpha });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if (!alpha) renderer.setClearColor(background);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Scene
  const scene = new THREE.Scene();
  if (!alpha) scene.background = new THREE.Color(background);

  // Camera
  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
  camera.position.set(...cameraPos);
  camera.lookAt(0, 0, 0);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);
  const pointLight = new THREE.PointLight(0x00e5ff, 0.3, 50);
  pointLight.position.set(-3, 3, 3);
  scene.add(pointLight);

  // OrbitControls
  let controls = null;
  if (enableControls && THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
  }

  // Resize handler
  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // Post-processing (bloom)
  let composer = null;
  if (bloom && THREE.EffectComposer) {
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    if (THREE.UnrealBloomPass) {
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(width, height), 0.8, 0.4, 0.2
      );
      composer.addPass(bloomPass);
    }
  }

  // Animation loop
  let frameId = null;
  let running = true;
  const clock = new THREE.Clock();

  const ctx = {
    scene,
    camera,
    renderer,
    controls,
    composer,
    clock,
    running: true,
    onUpdate: null, // user callback (delta, elapsed)
    start() {
      running = true;
      const animate = () => {
        if (!running) return;
        frameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        if (controls) controls.update();
        if (ctx.onUpdate) ctx.onUpdate(delta, elapsed);
        if (composer) composer.render();
        else renderer.render(scene, camera);
      };
      animate();
    },
    stop() {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
    },
    dispose() {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (controls) controls.dispose();
    }
  };

  return ctx;
}

/** Create a simple grid helper on the XZ plane with custom colors */
export function createGrid(scene, size = 20, divisions = 40, color = 0x00e5ff, opacity = 0.06) {
  const THREE = window.THREE;
  if (!THREE) return;
  const grid = new THREE.GridHelper(size, divisions, color, color);
  grid.material.opacity = opacity;
  grid.material.transparent = true;
  scene.add(grid);
  return grid;
}

/** Create glowing sphere (for poles/zeros) */
export function createGlowSphere(scene, position, color = 0x7c4dff, radius = 0.1) {
  const THREE = window.THREE;
  if (!THREE) return;
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.7
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  scene.add(mesh);
  return mesh;
}

/** Create a 3D line from an array of [x,y,z] points */
export function createLine3D(scene, points, color = 0x00e5ff, linewidth = 2) {
  const THREE = window.THREE;
  if (!THREE) return;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    positions[i * 3] = points[i][0];
    positions[i * 3 + 1] = points[i][1];
    positions[i * 3 + 2] = points[i][2];
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color, linewidth });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
}

/** Create axis labels */
export function createAxisLabels(scene, labels = ['x₁', 'x₂', 'x₃'], length = 5) {
  const THREE = window.THREE;
  if (!THREE) return;
  const colors = [0xff3d71, 0x69ff47, 0x00e5ff];
  const dirs = [[1,0,0],[0,1,0],[0,0,1]];
  dirs.forEach((dir, i) => {
    const points = [new THREE.Vector3(0,0,0), new THREE.Vector3(dir[0]*length, dir[1]*length, dir[2]*length)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: colors[i], opacity: 0.5, transparent: true });
    scene.add(new THREE.Line(geometry, material));
  });
}
