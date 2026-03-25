/**
 * assets/js/three-setup.js
 * Common three.js utility layout for Hero screens.
 * Reusable functionality across multiple chapters.
 */

// If THREE is loaded globally via CDN script tag
export function createScene(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return null;

  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(
    options.fov || 60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = options.cameraZ || 20;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Resize handler
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Basic Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // Mouse Parallax support
  let mouse = new THREE.Vector2();
  let target = new THREE.Vector2();
  const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

  document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX - windowHalf.x);
    mouse.y = (event.clientY - windowHalf.y);
  });

  return { scene, camera, renderer, mouse, target };
}

// Very basic material factories for control systems
export const MaterialFactory = {
  createPoleMaterial: function() {
    return new THREE.MeshStandardMaterial({
      color: 0x7c4dff, // violet
      emissive: 0x3d00e0,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });
  },
  
  createZeroMaterial: function() {
    return new THREE.MeshStandardMaterial({
      color: 0x00e5ff, // cyan
      emissive: 0x00b3cc,
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.5,
      transparent: true,
      opacity: 0.8
    });
  },

  createGridLineMaterial: function() {
    return new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.2
    });
  }
};
