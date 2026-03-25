import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch8', { cameraZ: 20 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // A classic pendulum on a cart or a floating drone adjusting to target height
    // Let's do a drone hovering

    const droneGroup = new THREE.Group();
    scene.add(droneGroup);

    // Drone Body
    const bodyGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x131c30, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    droneGroup.add(body);

    // Rotors
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.5 });
    const rotorGeo = new THREE.CylinderGeometry(1, 1, 0.1, 16);
    
    const rotors = [];
    const positions = [
        [2, 0.3, 2], [-2, 0.3, 2], [2, 0.3, -2], [-2, 0.3, -2]
    ];
    
    positions.forEach(pos => {
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.set(...pos);
        droneGroup.add(rotor);
        rotors.push(rotor);
    });

    // Glowing core
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x7c4dff });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), coreMat);
    droneGroup.add(core);

    // Target Line
    const targetY = 5;
    const gridY = new THREE.GridHelper(20, 20, 0x00e5ff, 0x00e5ff);
    gridY.position.y = targetY;
    gridY.material.transparent = true; gridY.material.opacity = 0.2;
    scene.add(gridY);

    // Initial state
    let y = -5; // current height
    let v = 0;  // velocity
    let integral = 0;
    
    const Kp = 0.5;
    const Ki = 0.05;
    const Kd = 0.8;
    const dt = 0.05;
    
    const gravity = -2.0;
    const mass = 1.0;

    camera.position.set(0, 5, 20);

    function animate() {
        requestAnimationFrame(animate);

        // PID Control Loop
        const error = targetY - y;
        integral += error * dt;
        const derivative = -v; // since target is constant, dE/dt = -dy/dt = -v
        
        let controlBase = 2.0; // feedforward to cancel gravity 
        let controlPid = Kp * error + Ki * integral + Kd * derivative;
        let thrust = Math.max(0, controlBase + controlPid); // Can't pull down

        // Physics
        const accel = (thrust + gravity) / mass;
        v += accel * dt;
        // Damping (air resistance)
        v *= 0.95;
        y += v * dt;

        droneGroup.position.y = y;

        // Spin rotors faster when thrust is higher
        rotors.forEach((r, i) => {
            r.rotation.y += (i%2===0 ? -1 : 1) * (0.1 + thrust * 0.2);
        });

        // Add some random disturbance to show it recovering
        if(Math.random() < 0.01) v -= 3.0; // sudden drop

        // Camera sway
        droneGroup.rotation.y = mouse.x * 0.5;
        droneGroup.rotation.x = mouse.y * 0.5;
        droneGroup.rotation.z = -v * 0.1; // tilt when moving vertically

        renderer.render(scene, camera);
    }
    animate();
});
