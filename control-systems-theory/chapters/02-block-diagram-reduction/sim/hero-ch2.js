import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch2', { cameraZ: 35 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    const group = new THREE.Group();
    scene.add(group);

    // Nodes for block diagram: cyan (blocks), amber (junctions)
    const geoBlock = new THREE.BoxGeometry(2, 2, 2);
    const geoJunction = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    geoJunction.rotateX(Math.PI/2);
    
    const matBlock = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x0088aa, emissiveIntensity: 0.5 });
    const matJunction = new THREE.MeshStandardMaterial({ color: 0xffab40, emissive: 0xaa6600, emissiveIntensity: 0.5 });

    const nodes = [];
    const positions = [
        [-15, 0, 0], [-5, 0, 0], [5, 0, 0], [15, 0, 0], // Forward path
        [-5, -10, 0], [5, 10, 0] // Feedback / feedforward paths
    ];
    
    positions.forEach((pos, i) => {
        const isJunc = (i === 1 || i === 3);
        const mesh = new THREE.Mesh(isJunc ? geoJunction : geoBlock, isJunc ? matJunction : matBlock);
        mesh.position.set(...pos);
        group.add(mesh);
        nodes.push(mesh);
    });

    // Edges with flowing particles
    const edges = [
        [0,1], [1,2], [2,3],
        [3,4], [4,1], // Feedback loop
        [0,5], [5,2]  // Feedforward loop
    ];

    const lineMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.4 });
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const particles = [];

    edges.forEach(edge => {
        const p1 = nodes[edge[0]].position;
        const p2 = nodes[edge[1]].position;
        
        // Draw line
        const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const line = new THREE.Line(geom, lineMat);
        group.add(line);
        
        // Add particle traveling along this edge
        const particle = new THREE.Mesh(particleGeo, particleMat);
        particle.position.copy(p1);
        group.add(particle);
        particles.push({ mesh: particle, p1: p1, p2: p2, progress: Math.random() });
    });

    camera.position.set(0, -10, 35);

    function animate() {
        requestAnimationFrame(animate);

        group.rotation.y += 0.005;
        group.rotation.x += 0.002;

        camera.position.x += (mouse.x * 0.05 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 0.05 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Animate particles along edges
        particles.forEach(p => {
            p.progress += 0.01;
            if (p.progress > 1) p.progress = 0;
            p.mesh.position.lerpVectors(p.p1, p.p2, p.progress);
        });

        renderer.render(scene, camera);
    }
    animate();
});
