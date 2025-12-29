import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Game state
const gameState = {
    level: 1,
    loot: 0,
    lootRequired: 10,
    health: 100,
    gravity: 1.0,
    timeWarp: 1.0,
    isPlaying: false,
    levelComplete: false,
    velocityY: 0,
    canJump: false
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000510);
scene.fog = new THREE.Fog(0x000510, 10, 100);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'gameCanvas';

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);

// Movement
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Lighting
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(10, 20, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

// Procedural world generation
class ProceduralWorld {
    constructor(seed) {
        this.seed = seed;
        this.platforms = [];
        this.lootItems = [];
        this.gravityZones = [];
        this.timeZones = [];
        this.aiGuards = [];
        this.particles = [];
    }

    random() {
        // Simple seeded random
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    generateFloatingArchitecture() {
        const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00, 0xff0000];
        
        // Create main platform
        const mainGeometry = new THREE.BoxGeometry(20, 1, 20);
        const mainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0088ff,
            emissive: 0x002244
        });
        const mainPlatform = new THREE.Mesh(mainGeometry, mainMaterial);
        mainPlatform.position.set(0, 0, 0);
        mainPlatform.receiveShadow = true;
        mainPlatform.castShadow = true;
        scene.add(mainPlatform);
        this.platforms.push(mainPlatform);

        // Generate floating platforms
        for (let i = 0; i < 15; i++) {
            const width = 3 + this.random() * 10;
            const height = 0.5 + this.random() * 1;
            const depth = 3 + this.random() * 10;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
                color: colors[Math.floor(this.random() * colors.length)],
                emissive: colors[Math.floor(this.random() * colors.length)],
                emissiveIntensity: 0.2
            });
            
            const platform = new THREE.Mesh(geometry, material);
            
            // Position platforms in a spiral pattern
            const angle = i * Math.PI / 3;
            const radius = 15 + i * 3;
            platform.position.x = Math.cos(angle) * radius;
            platform.position.y = 2 + i * 3;
            platform.position.z = Math.sin(angle) * radius;
            
            // Random rotation for surreal effect
            platform.rotation.x = this.random() * 0.3;
            platform.rotation.z = this.random() * 0.3;
            
            platform.castShadow = true;
            platform.receiveShadow = true;
            
            scene.add(platform);
            this.platforms.push(platform);

            // Add edges for visual effect
            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            platform.add(wireframe);
        }
    }

    generateLoot() {
        for (let i = 0; i < gameState.lootRequired; i++) {
            const geometry = new THREE.OctahedronGeometry(0.5);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.5,
                metalness: 0.8,
                roughness: 0.2
            });
            
            const loot = new THREE.Mesh(geometry, material);
            
            // Place loot on platforms (cycling through available platforms)
            const platformIndex = i % this.platforms.length;
            const platform = this.platforms[platformIndex];
            loot.position.copy(platform.position);
            loot.position.y += 2;
            
            // Add some variation if multiple loot items on same platform
            if (i >= this.platforms.length) {
                loot.position.x += (this.random() - 0.5) * 4;
                loot.position.z += (this.random() - 0.5) * 4;
            }
            
            loot.userData = { 
                type: 'loot',
                rotation: this.random() * Math.PI * 2,
                rotationSpeed: 0.01 + this.random() * 0.02
            };
            
            scene.add(loot);
            this.lootItems.push(loot);

            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            loot.add(glow);
        }
    }

    generateGravityZones() {
        const zoneTypes = [
            { gravity: 0.3, color: 0x00ffff, name: 'LOW' },
            { gravity: 2.0, color: 0xff0000, name: 'HIGH' },
            { gravity: -0.5, color: 0xff00ff, name: 'REVERSE' }
        ];

        for (let i = 0; i < 5; i++) {
            const zoneType = zoneTypes[Math.floor(this.random() * zoneTypes.length)];
            
            const geometry = new THREE.CylinderGeometry(5, 5, 20, 32, 1, true);
            const material = new THREE.MeshBasicMaterial({
                color: zoneType.color,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            
            const zone = new THREE.Mesh(geometry, material);
            
            const angle = i * Math.PI * 2 / 5;
            zone.position.x = Math.cos(angle) * 25;
            zone.position.y = 10;
            zone.position.z = Math.sin(angle) * 25;
            
            zone.userData = {
                type: 'gravityZone',
                gravity: zoneType.gravity,
                name: zoneType.name
            };
            
            scene.add(zone);
            this.gravityZones.push(zone);

            // Add particle ring
            this.createZoneParticles(zone, zoneType.color);
        }
    }

    generateTimeZones() {
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.TorusGeometry(4, 0.5, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3
            });
            
            const zone = new THREE.Mesh(geometry, material);
            
            const angle = i * Math.PI * 2 / 3 + Math.PI / 3;
            zone.position.x = Math.cos(angle) * 30;
            zone.position.y = 15 + i * 5;
            zone.position.z = Math.sin(angle) * 30;
            
            zone.rotation.x = Math.PI / 2;
            
            zone.userData = {
                type: 'timeZone',
                timeWarp: 0.5 + this.random() * 0.5,
                name: 'SLOW'
            };
            
            scene.add(zone);
            this.timeZones.push(zone);
        }
    }

    createZoneParticles(zone, color) {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 5;
            positions.push(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 20,
                Math.sin(angle) * radius
            );
            velocities.push(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });

        const particles = new THREE.Points(geometry, material);
        particles.userData = { velocities: velocities };
        zone.add(particles);
        this.particles.push(particles);
    }

    generateAIGuards() {
        for (let i = 0; i < 5; i++) {
            const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.3
            });
            
            const guard = new THREE.Mesh(bodyGeometry, bodyMaterial);
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.5);
            const head = new THREE.Mesh(headGeometry, bodyMaterial);
            head.position.y = 1.5;
            guard.add(head);

            // Vision cone
            const coneGeometry = new THREE.ConeGeometry(3, 8, 32, 1, true);
            const coneMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
            cone.rotation.x = Math.PI / 2;
            cone.position.z = -4;
            guard.add(cone);
            
            // Distribute guards across platforms more evenly
            const platformIndex = Math.floor((i + 1) * this.platforms.length / 6);
            const platform = this.platforms[Math.min(platformIndex, this.platforms.length - 1)];
            guard.position.copy(platform.position);
            guard.position.y += 2;
            
            guard.userData = {
                type: 'guard',
                patrolIndex: 0,
                speed: 0.02 + this.random() * 0.02,
                alertLevel: 0,
                patrolPoints: [
                    platform.position.clone().add(new THREE.Vector3(-3, 2, -3)),
                    platform.position.clone().add(new THREE.Vector3(3, 2, -3)),
                    platform.position.clone().add(new THREE.Vector3(3, 2, 3)),
                    platform.position.clone().add(new THREE.Vector3(-3, 2, 3))
                ]
            };
            
            guard.castShadow = true;
            scene.add(guard);
            this.aiGuards.push(guard);
        }
    }

    updateAI(playerPosition) {
        this.aiGuards.forEach(guard => {
            const userData = guard.userData;
            
            // Patrol behavior
            const targetPoint = userData.patrolPoints[userData.patrolIndex];
            const direction = new THREE.Vector3()
                .subVectors(targetPoint, guard.position)
                .normalize();
            
            const moveSpeed = userData.speed * gameState.timeWarp;
            guard.position.add(direction.clone().multiplyScalar(moveSpeed));
            
            // Look at patrol direction
            guard.lookAt(targetPoint);
            
            // Check if reached patrol point
            if (guard.position.distanceTo(targetPoint) < 0.5) {
                userData.patrolIndex = (userData.patrolIndex + 1) % userData.patrolPoints.length;
            }

            // Detection logic
            const distanceToPlayer = guard.position.distanceTo(playerPosition);
            if (distanceToPlayer < 10) {
                // Calculate if player is in vision cone
                const toPlayer = new THREE.Vector3()
                    .subVectors(playerPosition, guard.position)
                    .normalize();
                const forwardDir = new THREE.Vector3(0, 0, -1)
                    .applyQuaternion(guard.quaternion);
                const angle = toPlayer.dot(forwardDir);
                
                if (angle > 0.7) { // Within 45-degree cone
                    userData.alertLevel = Math.min(100, userData.alertLevel + 2);
                    guard.material.emissiveIntensity = 0.3 + (userData.alertLevel / 100) * 0.7;
                    
                    if (userData.alertLevel > 50) {
                        // Chase player with time warp
                        const chaseDir = new THREE.Vector3()
                            .subVectors(playerPosition, guard.position)
                            .normalize();
                        guard.position.add(chaseDir.multiplyScalar(userData.speed * 2 * gameState.timeWarp));
                        
                        // Damage player if close
                        if (distanceToPlayer < 2) {
                            gameState.health = Math.max(0, gameState.health - 0.5);
                        }
                    }
                } else {
                    userData.alertLevel = Math.max(0, userData.alertLevel - 1);
                    guard.material.emissiveIntensity = 0.3;
                }
            }
        });
    }

    updateParticles() {
        this.particles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = particleSystem.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];
                
                // Wrap around
                if (Math.abs(positions[i]) > 5) velocities[i] *= -1;
                if (Math.abs(positions[i + 1]) > 10) velocities[i + 1] *= -1;
                if (Math.abs(positions[i + 2]) > 5) velocities[i + 2] *= -1;
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
        });
    }

    clear() {
        // Remove all generated objects
        [...this.platforms, ...this.lootItems, ...this.gravityZones, 
         ...this.timeZones, ...this.aiGuards].forEach(obj => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        
        this.platforms = [];
        this.lootItems = [];
        this.gravityZones = [];
        this.timeZones = [];
        this.aiGuards = [];
        this.particles = [];
    }
}

// Initialize world
let world = new ProceduralWorld(Date.now());

function generateLevel() {
    world.clear();
    world = new ProceduralWorld(Date.now() + gameState.level * 1000);
    world.generateFloatingArchitecture();
    world.generateLoot();
    world.generateGravityZones();
    world.generateTimeZones();
    world.generateAIGuards();
    
    // Reset player position
    camera.position.set(0, 5, 0);
    gameState.velocityY = 0;
    gameState.loot = 0;
    gameState.health = 100;
}

// Cinematic camera shake
let cameraShake = { intensity: 0, decay: 0.95 };

function applyCameraShake() {
    if (cameraShake.intensity > 0.01) {
        camera.position.x += (Math.random() - 0.5) * cameraShake.intensity;
        camera.position.y += (Math.random() - 0.5) * cameraShake.intensity;
        camera.position.z += (Math.random() - 0.5) * cameraShake.intensity;
        cameraShake.intensity *= cameraShake.decay;
    }
}

// Check collisions with zones
function checkZones() {
    const playerPos = camera.position;
    
    // Reset to defaults
    gameState.gravity = 1.0;
    gameState.timeWarp = 1.0;
    
    // Check gravity zones
    world.gravityZones.forEach(zone => {
        const distance = new THREE.Vector2(
            playerPos.x - zone.position.x,
            playerPos.z - zone.position.z
        ).length();
        
        if (distance < 5 && Math.abs(playerPos.y - zone.position.y) < 10) {
            gameState.gravity = zone.userData.gravity;
            document.getElementById('gravity').textContent = `Gravity: ${zone.userData.name}`;
        }
    });
    
    // Check time zones
    world.timeZones.forEach(zone => {
        const distance = playerPos.distanceTo(zone.position);
        
        if (distance < 5) {
            gameState.timeWarp = zone.userData.timeWarp;
            document.getElementById('timeWarp').textContent = `Time: ${zone.userData.name}`;
        }
    });
    
    if (gameState.gravity === 1.0) {
        document.getElementById('gravity').textContent = 'Gravity: NORMAL';
    }
    if (gameState.timeWarp === 1.0) {
        document.getElementById('timeWarp').textContent = 'Time: NORMAL';
    }
}

// Check loot collection
function checkLootCollection() {
    const playerPos = camera.position;
    
    world.lootItems.forEach((loot, index) => {
        if (loot.visible) {
            const distance = playerPos.distanceTo(loot.position);
            
            if (distance < 2) {
                // Collect loot
                loot.visible = false;
                gameState.loot++;
                
                // Visual feedback
                cameraShake.intensity = 0.2;
                
                // Create collection particles
                createCollectionParticles(loot.position);
                
                document.getElementById('loot').textContent = 
                    `Loot: ${gameState.loot} / ${gameState.lootRequired}`;
                
                // Check level complete
                if (gameState.loot >= gameState.lootRequired) {
                    gameState.levelComplete = true;
                    document.getElementById('levelComplete').style.display = 'block';
                }
            }
        }
    });
}

function createCollectionParticles(position) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(position.x, position.y, position.z);
        velocities.push(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xffff00,
        size: 0.3,
        transparent: true
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities, lifetime: 60 };
    scene.add(particles);
    
    // Animate and remove
    const animate = () => {
        const pos = particles.geometry.attributes.position.array;
        const vel = particles.userData.velocities;
        
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += vel[i];
            pos[i + 1] += vel[i + 1];
            pos[i + 2] += vel[i + 2];
            vel[i + 1] -= 0.02; // Gravity
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        particles.material.opacity *= 0.95;
        particles.userData.lifetime--;
        
        if (particles.userData.lifetime > 0) {
            requestAnimationFrame(animate);
        } else {
            scene.remove(particles);
            particles.geometry.dispose();
            particles.material.dispose();
        }
    };
    animate();
}

// Ground collision check
function checkGroundCollision() {
    let onGround = false;
    const playerPos = camera.position;
    
    world.platforms.forEach(platform => {
        const platformTop = platform.position.y + platform.geometry.parameters.height / 2;
        
        // Use approximate radius-based collision to handle rotated platforms
        const maxRadius = Math.max(
            platform.geometry.parameters.width,
            platform.geometry.parameters.depth
        ) / 2;
        
        const horizontalDist = Math.sqrt(
            Math.pow(playerPos.x - platform.position.x, 2) +
            Math.pow(playerPos.z - platform.position.z, 2)
        );
        
        // Check if player is within platform radius
        if (horizontalDist < maxRadius) {
            // Check if player is at platform height
            if (playerPos.y <= platformTop + 2 && playerPos.y >= platformTop) {
                playerPos.y = platformTop + 2;
                gameState.velocityY = 0;
                onGround = true;
            }
        }
    });
    
    gameState.canJump = onGround;
    
    // Fall detection
    if (playerPos.y < -50) {
        gameState.health = Math.max(0, gameState.health - 20);
        playerPos.set(0, 5, 0);
        gameState.velocityY = 0;
        cameraShake.intensity = 1.0;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.isPlaying) return;
    
    const delta = 0.016 * gameState.timeWarp; // Fixed timestep with time warp
    
    // Update AI
    world.updateAI(camera.position);
    
    // Update particles
    world.updateParticles();
    
    // Rotate loot
    world.lootItems.forEach(loot => {
        loot.rotation.y += loot.userData.rotationSpeed * gameState.timeWarp;
        loot.position.y += Math.sin(Date.now() * 0.001 + loot.userData.rotation) * 0.01;
    });
    
    // Apply physics
    if (controls.isLocked) {
        // Apply gravity
        gameState.velocityY -= 0.5 * gameState.gravity * delta;
        camera.position.y += gameState.velocityY * delta;
        
        // Check collisions
        checkGroundCollision();
        checkZones();
        checkLootCollection();
        
        // Movement
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        
        direction.z = Number(moveState.forward) - Number(moveState.backward);
        direction.x = Number(moveState.right) - Number(moveState.left);
        direction.normalize();
        
        const speed = moveState.sprint ? 30 : 15;
        
        if (moveState.forward || moveState.backward) velocity.z -= direction.z * speed * delta;
        if (moveState.left || moveState.right) velocity.x -= direction.x * speed * delta;
        
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        // Jump
        if (moveState.jump && gameState.canJump) {
            gameState.velocityY = 10;
            gameState.canJump = false;
        }
    }
    
    // Camera effects
    applyCameraShake();
    
    // Update HUD
    document.getElementById('health').textContent = `Health: ${Math.floor(gameState.health)}`;
    
    // Check game over
    if (gameState.health <= 0) {
        gameState.health = 100;
        camera.position.set(0, 5, 0);
        gameState.velocityY = 0;
        cameraShake.intensity = 2.0;
    }
    
    renderer.render(scene, camera);
}

// Input handling
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
        case 'Space': moveState.jump = true; break;
        case 'ShiftLeft': moveState.sprint = true; break;
        case 'Enter':
            if (gameState.levelComplete) {
                gameState.level++;
                gameState.levelComplete = false;
                gameState.lootRequired = 10 + gameState.level * 2;
                document.getElementById('level').textContent = `Level: ${gameState.level}`;
                document.getElementById('levelComplete').style.display = 'none';
                generateLevel();
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyD': moveState.right = false; break;
        case 'Space': moveState.jump = false; break;
        case 'ShiftLeft': moveState.sprint = false; break;
    }
});

// Start screen
document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    controls.lock();
});

controls.addEventListener('lock', () => {
    gameState.isPlaying = true;
    if (world.platforms.length === 0) {
        generateLevel();
    }
});

controls.addEventListener('unlock', () => {
    gameState.isPlaying = false;
});

// Window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation loop
animate();
