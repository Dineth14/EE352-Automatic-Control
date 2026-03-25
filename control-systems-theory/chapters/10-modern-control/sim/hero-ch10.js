import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch10', { cameraZ: 20 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // A visual representing "Optimal Trajectory" through state space
    // Let's create an abstract 3D grid and a glowing path finding its way to the origin

    const gridHelper = new THREE.GridHelper(20, 20, 0x131c30, 0x131c30);
    scene.add(gridHelper);

    // State space origin 
    const originGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const originMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const originMesh = new THREE.Mesh(originGeo, originMat);
    scene.add(originMesh);

    // Initial state
    const pGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xff3d71 });
    const particle = new THREE.Mesh(pGeo, pMat);
    scene.add(particle);

    // Trajectory History Line
    const maxPts = 200;
    const lineGeo = new THREE.BufferGeometry();
    const pts = new Float32Array(maxPts * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffab40, linewidth: 3, transparent: true, opacity: 0.8 });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    let tAnim = 0;
    let state = new THREE.Vector3(8, 5, 8); // Start
    let ptIdx = 0;

    camera.position.set(-10, 10, 15);
    camera.lookAt(0,0,0);

    function animate() {
        requestAnimationFrame(animate);
        tAnim += 0.02;

        // Abstract LQR continuous dynamics dx/dt = (A - BK)x
        // We'll simulate matrices arbitrarily to spiral into the origin
        const A = [
            [-0.1,  1.0,  0.0],
            [-1.0, -0.2,  0.5],
            [ 0.0, -0.5, -0.3]
        ];
        
        const dt = 0.05;
        const dx = A[0][0]*state.x + A[0][1]*state.y + A[0][2]*state.z;
        const dy = A[1][0]*state.x + A[1][1]*state.y + A[1][2]*state.z;
        const dz = A[2][0]*state.x + A[2][1]*state.y + A[2][2]*state.z;

        state.x += dx * dt;
        state.y += dy * dt;
        state.z += dz * dt;

        particle.position.copy(state);

        // Update trail
        pts[ptIdx*3] = state.x;
        pts[ptIdx*3+1] = state.y;
        pts[ptIdx*3+2] = state.z;
        
        ptIdx = (ptIdx + 1) % maxPts;
        lineGeo.attributes.position.needsUpdate = true;

        if (state.lengthSq() < 0.1) {
            // Reset to random position when reaching origin
            state.set(
                (Math.random()-0.5)*16,
                (Math.random()-0.5)*10 + 5,
                (Math.random()-0.5)*16
            );
            // clear trail
            for(let i=0; i<maxPts*3; i++) pts[i] = state.toArray()[i%3];
        }

        scene.rotation.y = mouse.x * 0.5 + Date.now()*0.0002;
        scene.rotation.x = mouse.y * 0.2;

        renderer.render(scene, camera);
    }
    
    // Fill initial trail
    for(let i=0; i<maxPts*3; i++) pts[i] = state.toArray()[i%3];
    animate();
});
