// sim/state-trajectory-3d.js
import { createScene } from '../../assets/js/three-setup.js';
import { MathUtils } from '../../assets/js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('canvas-traj-3d', { cameraZ: 20 });
    if(!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    const btnReset = document.getElementById('btn-sim-reset');
    const inputs = {
        a11: document.getElementById('a11'), a12: document.getElementById('a12'), a13: document.getElementById('a13'),
        a21: document.getElementById('a21'), a22: document.getElementById('a22'), a23: document.getElementById('a23'),
        a31: document.getElementById('a31'), a32: document.getElementById('a32'), a33: document.getElementById('a33')
    };

    let A = [[-0.5, -1, 0.5], [1, -0.5, 0], [0, 1, -0.2]];

    function readA() {
        A = [
            [parseFloat(inputs.a11.value), parseFloat(inputs.a12.value), parseFloat(inputs.a13.value)],
            [parseFloat(inputs.a21.value), parseFloat(inputs.a22.value), parseFloat(inputs.a23.value)],
            [parseFloat(inputs.a31.value), parseFloat(inputs.a32.value), parseFloat(inputs.a33.value)]
        ];
        // fallback to 0 if NaN
        A = A.map(row => row.map(val => isNaN(val) ? 0 : val));
    }

    const gridXY = new THREE.GridHelper(20, 20, 0x00e5ff, 0x00e5ff); gridXY.material.transparent=true; gridXY.material.opacity=0.2; gridXY.rotation.x=Math.PI/2; scene.add(gridXY);
    const axesHelper = new THREE.AxesHelper(10); scene.add(axesHelper);

    const MAX_POINTS = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: 0xffab40, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // Particle
    const pGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffab40 });
    const particle = new THREE.Mesh(pGeo, pMat);
    scene.add(particle);

    let state = [5, 5, 5];
    let time = 0;
    const dt = 0.05;
    let pointCount = 0;

    function resetSim() {
        readA();
        state = [(Math.random()-0.5)*15, (Math.random()-0.5)*15, (Math.random()-0.5)*15];
        time = 0;
        pointCount = 0;
        for(let i=0; i<MAX_POINTS*3; i++) positions[i] = 0;
    }

    btnReset.addEventListener('click', resetSim);
    Object.values(inputs).forEach(inp => inp.addEventListener('change', resetSim));

    camera.position.set(10, 10, 15);
    camera.lookAt(0,0,0);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    renderer.domElement.addEventListener('mousemove', (e) => {
        if(isDragging) {
            const deltaMove = { x: e.offsetX - previousMousePosition.x, y: e.offsetY - previousMousePosition.y };
            scene.rotation.y += deltaMove.x * 0.01;
            scene.rotation.x += deltaMove.y * 0.01;
        }
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    function ode(t, x, u) { return MathUtils.matVecMul(A, x); }

    function animate() {
        requestAnimationFrame(animate);

        // Simulation step
        state = MathUtils.rk4(ode, state, time, dt, 0);
        time += dt;

        if (pointCount < MAX_POINTS) {
            positions[pointCount*3] = state[0];
            positions[pointCount*3+1] = state[1];
            positions[pointCount*3+2] = state[2];
            pointCount++;
        } else {
            for(let i=0; i<MAX_POINTS-1; i++) {
                positions[i*3] = positions[(i+1)*3];
                positions[i*3+1] = positions[(i+1)*3+1];
                positions[i*3+2] = positions[(i+1)*3+2];
            }
            positions[(MAX_POINTS-1)*3] = state[0];
            positions[(MAX_POINTS-1)*3+1] = state[1];
            positions[(MAX_POINTS-1)*3+2] = state[2];
        }

        geometry.setDrawRange(0, pointCount);
        geometry.attributes.position.needsUpdate = true;
        particle.position.set(state[0], state[1], state[2]);

        renderer.render(scene, camera);
    }
    resetSim();
    animate();
});
