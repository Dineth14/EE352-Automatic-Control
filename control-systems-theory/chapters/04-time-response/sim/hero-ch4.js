import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch4', { cameraZ: 40 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    camera.position.set(0, 15, 35);
    camera.lookAt(0,0,0);

    // 3D Surface geometry: f(time, zeta) -> amplitude y
    const timeSteps = 50;
    const zetaSteps = 30;
    
    const geometry = new THREE.PlaneGeometry(30, 20, timeSteps, zetaSteps);
    // Rotate so Time is X, Zeta is Z, Y is up
    geometry.rotateX(-Math.PI / 2);

    // The function: Step response of 2nd order system
    // y(t, z) = 1 - e^(-z*t)/sqrt(1-z^2) * sin(sqrt(1-z^2)*t + acos(z))
    function calculateY(t, zeta) {
        if(zeta >= 1.0) zeta=0.999;
        if(zeta <= 0.0) zeta=0.001;
        const wd = Math.sqrt(1 - zeta*zeta);
        const phi = Math.acos(zeta);
        return 1 - (Math.exp(-zeta * t) / wd) * Math.sin(wd * t + phi);
    }

    const positions = geometry.attributes.position.array;
    for(let i=0; i<=zetaSteps; i++) {
        for(let j=0; j<=timeSteps; j++) {
            const index = (i * (timeSteps + 1) + j) * 3;
            // Map j to time [0, 15]
            const t = (j / timeSteps) * 15;
            // Map i to zeta [0.05, 0.9]
            const zeta = 0.05 + (i / zetaSteps) * 0.85;
            
            const y = calculateY(t, zeta);
            
            positions[index + 1] = y * 5; // scale Y for dramatic effect
        }
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        side: THREE.DoubleSide,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });

    const surface = new THREE.Mesh(geometry, material);
    scene.add(surface);

    let t_anim = 0;
    function animate() {
        requestAnimationFrame(animate);
        t_anim += 0.01;

        // Subtle undulating wave effect on the whole surface for visual interest entirely independent of the rigid math
        surface.rotation.y = Math.sin(t_anim * 0.5) * 0.1;

        camera.position.x += (mouse.x * 0.05 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 0.05 + 15 - camera.position.y) * 0.05;
        camera.lookAt(0,0,0);

        renderer.render(scene, camera);
    }
    animate();
});
