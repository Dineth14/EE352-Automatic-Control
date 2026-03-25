import { createScene } from '../../assets/js/three-setup.js';
import { MathUtils } from '../../assets/js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch3', { cameraZ: 25 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // Draw 3D axis
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // Grid planes for phase portraits
    const gridXY = new THREE.GridHelper(20, 20, 0x00e5ff, 0x00e5ff);
    gridXY.material.transparent = true; gridXY.material.opacity = 0.1;
    gridXY.rotation.x = Math.PI/2;
    gridXY.position.z = -10;
    scene.add(gridXY);

    const gridXZ = new THREE.GridHelper(20, 20, 0x7c4dff, 0x7c4dff);
    gridXZ.material.transparent = true; gridXZ.material.opacity = 0.1;
    gridXZ.position.y = -10;
    scene.add(gridXZ);

    // Chaotic / Interesting System (Lorenz-like or simple oscillator)
    // We'll use a modified stable oscillator that spirals
    const A = [
        [-0.1, -1.0,  0.5],
        [ 1.0, -0.1,  0.0],
        [ 0.0,  0.5, -0.2]
    ];

    let state = [5, 5, 5];
    const dt = 0.05;

    // Trajectory ribbon / line
    const MAX_POINTS = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
        color: 0x7c4dff,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
    });
    
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // Head particle
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const head = new THREE.Mesh(headGeo, headMat);
    scene.add(head);

    let pointCount = 0;
    let time = 0;

    camera.position.set(15, 10, 25);
    
    function ode(t, x, u) {
        return MathUtils.matVecMul(A, x);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Integrate
        for(let step=0; step<2; step++){
            state = MathUtils.rk4(ode, state, time, dt, 0);
            time += dt;

            // Shift array
            for(let i=MAX_POINTS-1; i>0; i--) {
                positions[i*3] = positions[(i-1)*3];
                positions[i*3+1] = positions[(i-1)*3+1];
                positions[i*3+2] = positions[(i-1)*3+2];
            }
            positions[0] = state[0];
            positions[1] = state[1];
            positions[2] = state[2];
            
            if(pointCount < MAX_POINTS) pointCount++;
        }

        // Add slow pulse to A matrix to keep it alive
        A[0][2] = 0.5 * Math.sin(time*0.1);
        A[2][0] = -0.5 * Math.sin(time*0.1);

        // If it decays too much, reset
        if (state[0]*state[0] + state[1]*state[1] + state[2]*state[2] < 1) {
            state = [Math.random()*10 - 5, Math.random()*10 - 5, 10];
        }

        geometry.setDrawRange(0, pointCount);
        geometry.attributes.position.needsUpdate = true;

        head.position.set(state[0], state[1], state[2]);

        // Orbit camera
        scene.rotation.y += 0.005;
        
        camera.position.x += (mouse.x * 0.05 - camera.position.x + 15) * 0.05;
        camera.position.y += (-mouse.y * 0.05 - camera.position.y + 10) * 0.05;
        camera.lookAt(0,0,0);

        renderer.render(scene, camera);
    }
    animate();
});
