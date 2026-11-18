// 1. Custom Cursor
const cursor = document.createElement('div');
cursor.className = 'cursor-highlight';
document.body.appendChild(cursor);
document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// 2. Three.js Cinematic Scroll Experience
const canvas = document.getElementById('hero-canvas');
if (canvas && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050A15, 0.002);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // --- ENVIRONMENT: Digital Highway ---
    const roadGeo = new THREE.PlaneGeometry(30, 400, 1, 1);
    const roadMat = new THREE.MeshStandardMaterial({ 
        color: 0x0A1428, 
        roughness: 0.8,
        metalness: 0.2
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -100;
    scene.add(road);

    // Highway lines
    const lineGeo = new THREE.PlaneGeometry(0.5, 400);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.3 });
    const line1 = new THREE.Mesh(lineGeo, lineMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(-5, 0.1, -100);
    scene.add(line1);
    const line2 = line1.clone();
    line2.position.set(5, 0.1, -100);
    scene.add(line2);

    // --- THE TRUCK ---
    const truck = new THREE.Group();
    
    // Trailer
    const trailerGeo = new THREE.BoxGeometry(4, 3, 8);
    const trailerMat = new THREE.MeshStandardMaterial({ color: 0x1A2A4A, metalness: 0.8, roughness: 0.2 });
    const trailer = new THREE.Mesh(trailerGeo, trailerMat);
    trailer.position.y = 2.5;
    truck.add(trailer);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(3.5, 2.5, 3);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 2.25, 5);
    truck.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
    
    const wheelPositions = [
        [-2, 0.8, 4], [2, 0.8, 4], // Front wheels
        [-2, 0.8, -2], [2, 0.8, -2], // Rear wheels 1
        [-2, 0.8, -4], [2, 0.8, -4]  // Rear wheels 2
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        truck.add(wheel);
    });

    truck.position.set(0, 0, 10);
    scene.add(truck);

    // --- PARTICLES (The Transformation) ---
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const startPositions = new Float32Array(particleCount * 3); // Inside truck
    const endPositions = new Float32Array(particleCount * 3); // Sphere shape

    for(let i = 0; i < particleCount * 3; i += 3) {
        // Start: Scattered around the truck volume
        startPositions[i] = (Math.random() - 0.5) * 6;
        startPositions[i+1] = (Math.random() - 0.5) * 4 + 2;
        startPositions[i+2] = (Math.random() - 0.5) * 12 + 4;

        // End: A glowing sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 8;
        endPositions[i] = r * Math.sin(phi) * Math.cos(theta);
        endPositions[i+1] = r * Math.sin(phi) * Math.sin(theta) + 5;
        endPositions[i+2] = r * Math.cos(phi);

        // Initial state
        posArray[i] = startPositions[i];
        posArray[i+1] = startPositions[i+1];
        posArray[i+2] = startPositions[i+2];
    }

    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Custom shader material for glowing particles
    const particleMat = new THREE.PointsMaterial({
        size: 0.15,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });

    const particleMesh = new THREE.Points(particles, particleMat);
    scene.add(particleMesh);

    // --- SCROLL LOGIC ---
    let scrollY = 0;
    let targetScrollY = 0;

    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();

        // Smooth scroll interpolation
        scrollY += (targetScrollY - scrollY) * 0.08;

        // Calculate scroll progress (0 to 1) based on 400vh container
        const maxScroll = window.innerHeight * 3;
        const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

        // 1. TRUCK MOVEMENT & FADE
        // Truck moves forward, then fades out
        truck.position.z = 10 - (progress * 50);
        truck.rotation.x = Math.sin(elapsedTime * 2) * 0.02; // Idle bounce
        truck.rotation.y = Math.sin(elapsedTime * 1) * 0.02; // Slight sway
        
        // Fade truck out as particles fade in
        const truckOpacity = 1 - Math.min(progress * 3, 1);
        truck.children.forEach(child => {
            if(child.material) {
                child.material.transparent = true;
                child.material.opacity = truckOpacity;
            }
        });

        // 2. PARTICLE TRANSFORMATION
        if (progress > 0.1) {
            particleMat.opacity = Math.min((progress - 0.1) * 3, 1);
            
            // Morph particles from truck shape to sphere
            const positions = particles.attributes.position.array;
            // We only need to update this once per frame, and only if progress changes significantly
            // To save performance, we can use a simple lerp based on progress
            const morphFactor = Math.min(Math.max((progress - 0.3) * 2, 0), 1); // Start morph at 30% scroll

            for (let i = 0; i < particleCount * 3; i++) {
                positions[i] = startPositions[i] + (endPositions[i] - startPositions[i]) * morphFactor;
            }
            particles.attributes.position.needsUpdate = true;
            
            // Rotate the particle sphere
            particleMesh.rotation.y = elapsedTime * 0.2;
        } else {
            particleMat.opacity = 0;
        }

        // 3. CAMERA MOVEMENT
        // Move camera forward slightly, then orbit around the sphere
        if (progress < 0.4) {
            camera.position.set(0, 5, 25 - progress * 10);
            camera.lookAt(0, 2, 0);
        } else {
            // Orbit around the globe
            const orbitAngle = elapsedTime * 0.1;
            camera.position.x = Math.sin(orbitAngle) * 18;
            camera.position.z = Math.cos(orbitAngle) * 18;
            camera.position.y = 10;
            camera.lookAt(0, 5, 0);
        }

        // Update Text Opacity based on scroll
        const heroText = document.querySelector('.hero-text');
        if (heroText) {
            heroText.style.opacity = 1 - (progress * 2);
        }

        renderer.render(scene, camera);
    }

    animate();
}
