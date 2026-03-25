import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch7', { cameraZ: 30 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // Visualizing Lyapunov Stability / Energy Landscape
    // A stable potential well V(x) = x_1^2 + x_2^2
    
    const geom = new THREE.PlaneGeometry(20, 20, 50, 50);
    geom.rotateX(-Math.PI / 2);

    const positions = geom.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        
        // Potential well with inverted rim
        const r2 = x*x + z*z;
        const v = Math.min(r2 * 0.1, 10);
        
        positions[i + 1] = v - 5; // Center is low
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });

    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    // Particle rolling down into the well
    const pGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffab40 });
    const particle = new THREE.Mesh(pGeo, pMat);
    scene.add(particle);

    let state = [8, 8]; // x1, x2
    const dt = 0.05;

    camera.position.set(0, 15, 25);
    camera.lookAt(0,0,0);

    function animate() {
        requestAnimationFrame(animate);

        // Gradient descent on V = x1^2 + x2^2 -> dx/dt = -dV/dx
        // with some rotational component
        const x1 = state[0]; const x2 = state[1];
        const dx1 = -0.5*x1 - 2*x2;
        const dx2 = 2*x1 - 0.5*x2;
        
        state[0] += dx1 * dt;
        state[1] += dx2 * dt;

        // Reset if it reached bottom
        if (state[0]*state[0] + state[1]*state[1] < 0.1) {
            state = [(Math.random()-0.5)*18, (Math.random()-0.5)*18];
        }

        const h = Math.min((state[0]*state[0] + state[1]*state[1]) * 0.1, 10) - 5;
        particle.position.set(state[0], h + 0.5, state[1]);

        mesh.rotation.y = mouse.x * 0.2 + Date.now()*0.0005;
        
        // Match particle to rotated mesh space
        const radius = Math.hypot(state[0], state[1]);
        const angle = Math.atan2(state[1], state[0]) + mesh.rotation.y;
        
        particle.position.x = radius * Math.cos(angle);
        particle.position.z = radius * Math.sin(angle);

        camera.position.y += (-mouse.y * 5 + 15 - camera.position.y) * 0.05;
        camera.lookAt(0,-5,0);

        renderer.render(scene, camera);
    }
    animate();
});
