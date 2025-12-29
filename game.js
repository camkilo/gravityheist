import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Constants for game tuning
const GRAVITY_ROTATION_SPEED = 0.05;
const PARTICLE_LIFETIME = 80;
const VERTICAL_GRAVITY_THRESHOLD = 0.5;
const ECHO_GUARD_HISTORY_LENGTH = 60;

// Game state - Enhanced for Black Vaults
const gameState = {
    level: 1,
    loot: 0,
    lootRequired: 10,
    health: 100,
    gravity: new THREE.Vector3(0, -1, 0), // Directional gravity vector
    gravityMagnitude: 1.0,
    timeWarp: 1.0,
    isPlaying: false,
    levelComplete: false,
    velocity: new THREE.Vector3(0, 0, 0), // 3D velocity for physics
    canJump: false,
    gravityRotation: 0, // For gravity rotation controls
    cinematicMode: false,
    structuralIntegrity: 100 // For destructible environments
};

// Scene setup - Enhanced with volumetric fog
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000510);
scene.fog = new THREE.FogExp2(0x000510, 0.015); // Volumetric fog

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 0);

// Renderer - Enhanced for cinematic effects
// Note: Tone mapping adds post-processing overhead. For low-end devices,
// consider disabling or using a simpler tone mapping algorithm.
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'gameCanvas';

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);

// Movement - Enhanced for 3D gravity
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    rotateGravityLeft: false,
    rotateGravityRight: false,
    useAbility: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Lighting - Enhanced with volumetric effects
const ambientLight = new THREE.AmbientLight(0x404060, 0.3);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(10, 20, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.far = 100;
scene.add(mainLight);

// Add volumetric god rays effect with multiple colored lights
const neonLights = [
    { color: 0x00ffff, pos: new THREE.Vector3(-20, 15, -20) },
    { color: 0xff00ff, pos: new THREE.Vector3(20, 15, -20) },
    { color: 0xffff00, pos: new THREE.Vector3(0, 25, 20) }
];

neonLights.forEach(lightData => {
    const light = new THREE.PointLight(lightData.color, 2, 50);
    light.position.copy(lightData.pos);
    scene.add(light);
});

// Procedural world generation - Enhanced for Black Vaults
class ProceduralWorld {
    constructor(seed) {
        this.seed = seed;
        this.platforms = [];
        this.lootItems = [];
        this.gravityZones = [];
        this.timeZones = [];
        this.aiGuards = [];
        this.particles = [];
        this.dynamicElements = []; // Sliding walls, dissolving floors
        this.timeFractureZones = []; // Advanced time effects
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
            emissive: 0x002244,
            metalness: 0.7,
            roughness: 0.3
        });
        const mainPlatform = new THREE.Mesh(mainGeometry, mainMaterial);
        mainPlatform.position.set(0, 0, 0);
        mainPlatform.receiveShadow = true;
        mainPlatform.castShadow = true;
        mainPlatform.userData = { type: 'platform', structural: true };
        scene.add(mainPlatform);
        this.platforms.push(mainPlatform);

        // Generate Escher-style impossible architecture
        for (let i = 0; i < 15; i++) {
            const width = 3 + this.random() * 10;
            const height = 0.5 + this.random() * 1;
            const depth = 3 + this.random() * 10;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
                color: colors[Math.floor(this.random() * colors.length)],
                emissive: colors[Math.floor(this.random() * colors.length)],
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            });
            
            const platform = new THREE.Mesh(geometry, material);
            
            // Position platforms in impossible configurations
            const angle = i * Math.PI / 3;
            const radius = 15 + i * 3;
            platform.position.x = Math.cos(angle) * radius;
            platform.position.y = 2 + i * 3;
            platform.position.z = Math.sin(angle) * radius;
            
            // Extreme rotations for Escher effect
            platform.rotation.x = this.random() * Math.PI * 0.5;
            platform.rotation.z = this.random() * Math.PI * 0.5;
            
            platform.castShadow = true;
            platform.receiveShadow = true;
            platform.userData = { 
                type: 'platform', 
                structural: true,
                mass: width * height * depth,
                canSlide: this.random() > 0.7, // Some platforms can slide
                slideDirection: new THREE.Vector3(
                    (this.random() - 0.5) * 0.05,
                    0,
                    (this.random() - 0.5) * 0.05
                )
            };
            
            scene.add(platform);
            this.platforms.push(platform);

            // Add edges with neon glow
            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0xffffff,
                linewidth: 2
            });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            platform.add(wireframe);
            
            // Add dynamic dissolving floors (some platforms can dissolve)
            if (this.random() > 0.8) {
                platform.userData.canDissolve = true;
                platform.userData.dissolveProgress = 0;
            }
        }
        
        // Add impossible geometry - walls that connect at wrong angles
        this.generateImpossibleWalls();
    }

    generateImpossibleWalls() {
        // Create sliding walls and Escher-style connections
        for (let i = 0; i < 5; i++) {
            const wallGeometry = new THREE.BoxGeometry(15, 10, 1);
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x4444ff,
                emissive: 0x000044,
                emissiveIntensity: 0.5,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.8
            });
            
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            const angle = i * Math.PI * 2 / 5;
            wall.position.x = Math.cos(angle) * 30;
            wall.position.y = 10 + i * 2;
            wall.position.z = Math.sin(angle) * 30;
            wall.rotation.y = angle + Math.PI / 2;
            
            wall.userData = {
                type: 'wall',
                canSlide: true,
                slideSpeed: 0.02 + this.random() * 0.03,
                slideRange: 5,
                slideOffset: 0,
                slideDirection: 1
            };
            
            wall.castShadow = true;
            scene.add(wall);
            this.dynamicElements.push(wall);
        }
    }

    generateLoot() {
        for (let i = 0; i < gameState.lootRequired; i++) {
            const lootSize = 0.3 + this.random() * 0.4; // Variable size
            const geometry = new THREE.OctahedronGeometry(lootSize);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.7,
                metalness: 0.9,
                roughness: 0.1
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
            
            // Physics properties for Black Vaults
            const mass = lootSize * lootSize * lootSize * 100; // Volume-based mass
            loot.userData = { 
                type: 'loot',
                rotation: this.random() * Math.PI * 2,
                rotationSpeed: 0.01 + this.random() * 0.02,
                mass: mass, // Heavy loot can break floors
                destructionValue: mass * 0.5, // How much damage when dropped
                momentum: new THREE.Vector3(0, 0, 0)
            };
            
            scene.add(loot);
            this.lootItems.push(loot);

            // Add enhanced glow effect with multiple layers
            const glowGeometry = new THREE.SphereGeometry(lootSize * 1.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.4
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            loot.add(glow);
            
            // Outer glow
            const outerGlowGeometry = new THREE.SphereGeometry(lootSize * 2, 16, 16);
            const outerGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.2
            });
            const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
            loot.add(outerGlow);
        }
    }

    generateGravityZones() {
        // Directional gravity zones - not just magnitude but direction
        const zoneTypes = [
            { gravityVector: new THREE.Vector3(0, -0.3, 0), color: 0x00ffff, name: 'LOW' },
            { gravityVector: new THREE.Vector3(0, -2.0, 0), color: 0xff0000, name: 'HIGH' },
            { gravityVector: new THREE.Vector3(0, 0.5, 0), color: 0xff00ff, name: 'REVERSE' },
            { gravityVector: new THREE.Vector3(-1, -0.5, 0), color: 0x00ff00, name: 'SIDEWAYS' },
            { gravityVector: new THREE.Vector3(0, -0.5, -1), color: 0xffaa00, name: 'DIAGONAL' }
        ];

        for (let i = 0; i < 5; i++) {
            const zoneType = zoneTypes[Math.floor(this.random() * zoneTypes.length)];
            
            const geometry = new THREE.CylinderGeometry(5, 5, 20, 32, 1, true);
            const material = new THREE.MeshBasicMaterial({
                color: zoneType.color,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            
            const zone = new THREE.Mesh(geometry, material);
            
            const angle = i * Math.PI * 2 / 5;
            zone.position.x = Math.cos(angle) * 25;
            zone.position.y = 10;
            zone.position.z = Math.sin(angle) * 25;
            
            zone.userData = {
                type: 'gravityZone',
                gravityVector: zoneType.gravityVector.clone(),
                name: zoneType.name
            };
            
            scene.add(zone);
            this.gravityZones.push(zone);

            // Add particle ring with enhanced effects
            this.createZoneParticles(zone, zoneType.color);
        }
    }

    generateTimeZones() {
        // Enhanced time fracture zones with multiple effects
        const timeFractureTypes = [
            { effect: 'slow', timeWarp: 0.3, color: 0x00ff00, name: 'SLOW' },
            { effect: 'freeze', timeWarp: 0.05, color: 0x0088ff, name: 'FREEZE' },
            { effect: 'rewind', timeWarp: -0.5, color: 0xff00aa, name: 'REWIND' },
            { effect: 'shatter', timeWarp: 2.0, color: 0xffff00, name: 'FAST' }
        ];
        
        for (let i = 0; i < 4; i++) {
            const fractureType = timeFractureTypes[i];
            const geometry = new THREE.TorusGeometry(4, 0.5, 16, 100);
            const material = new THREE.MeshBasicMaterial({
                color: fractureType.color,
                transparent: true,
                opacity: 0.4
            });
            
            const zone = new THREE.Mesh(geometry, material);
            
            const angle = i * Math.PI * 2 / 4;
            zone.position.x = Math.cos(angle) * 35;
            zone.position.y = 15 + i * 4;
            zone.position.z = Math.sin(angle) * 35;
            
            zone.rotation.x = Math.PI / 2;
            zone.rotation.y = this.random() * Math.PI;
            
            zone.userData = {
                type: 'timeFractureZone',
                effect: fractureType.effect,
                timeWarp: fractureType.timeWarp,
                name: fractureType.name,
                pulsePhase: this.random() * Math.PI * 2
            };
            
            scene.add(zone);
            this.timeFractureZones.push(zone);
            this.timeZones.push(zone); // Keep for compatibility
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
        const guardTypes = ['sentinel', 'echo', 'void', 'basic', 'basic'];
        
        for (let i = 0; i < 5; i++) {
            const guardType = guardTypes[i];
            let guard, bodyMaterial;
            
            if (guardType === 'sentinel') {
                // Sentinel Warden: Rewrites gravity locally
                const bodyGeometry = new THREE.BoxGeometry(1.2, 2.2, 1.2);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8800ff,
                    emissive: 0x4400aa,
                    emissiveIntensity: 0.5,
                    metalness: 0.9,
                    roughness: 0.1
                });
                guard = new THREE.Mesh(bodyGeometry, bodyMaterial);
            } else if (guardType === 'echo') {
                // Echo Guard: Repeats player's last move pattern
                const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0x00ffff,
                    emissive: 0x008888,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.7
                });
                guard = new THREE.Mesh(bodyGeometry, bodyMaterial);
            } else if (guardType === 'void') {
                // Void Architect: Actively rebuilds rooms
                const bodyGeometry = new THREE.OctahedronGeometry(1.2);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: 0xff0088,
                    emissiveIntensity: 0.7,
                    metalness: 1.0,
                    roughness: 0.0
                });
                guard = new THREE.Mesh(bodyGeometry, bodyMaterial);
            } else {
                // Basic guard
                const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.3
                });
                guard = new THREE.Mesh(bodyGeometry, bodyMaterial);
            }
            
            // Head (except for void architect)
            if (guardType !== 'void') {
                const headGeometry = new THREE.SphereGeometry(0.5);
                const head = new THREE.Mesh(headGeometry, bodyMaterial);
                head.position.y = 1.5;
                guard.add(head);
            }

            // Vision cone
            const coneGeometry = new THREE.ConeGeometry(3, 8, 32, 1, true);
            const coneMaterial = new THREE.MeshBasicMaterial({
                color: guardType === 'sentinel' ? 0x8800ff : (guardType === 'echo' ? 0x00ffff : 0xff0000),
                transparent: true,
                opacity: 0.15,
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
                guardType: guardType,
                patrolIndex: 0,
                speed: 0.02 + this.random() * 0.02,
                alertLevel: 0,
                patrolPoints: [
                    platform.position.clone().add(new THREE.Vector3(-3, 2, -3)),
                    platform.position.clone().add(new THREE.Vector3(3, 2, -3)),
                    platform.position.clone().add(new THREE.Vector3(3, 2, 3)),
                    platform.position.clone().add(new THREE.Vector3(-3, 2, 3))
                ],
                playerPositionHistory: [], // For echo guards
                lastRoomChangeTime: 0 // For void architects
            };
            
            guard.castShadow = true;
            scene.add(guard);
            this.aiGuards.push(guard);
        }
    }

    updateAI(playerPosition) {
        this.aiGuards.forEach(guard => {
            const userData = guard.userData;
            
            // Special behaviors based on guard type
            if (userData.guardType === 'sentinel') {
                // Sentinel Wardens rewrite gravity locally
                const distToGuard = guard.position.distanceTo(playerPosition);
                if (distToGuard < 15) {
                    // Apply localized gravity field (handled in checkZones)
                    guard.userData.gravityField = new THREE.Vector3(
                        (playerPosition.x - guard.position.x) * 0.01,
                        -0.5,
                        (playerPosition.z - guard.position.z) * 0.01
                    );
                }
            } else if (userData.guardType === 'echo') {
                // Echo Guards repeat player's last move pattern
                userData.playerPositionHistory.push(playerPosition.clone());
                // Use circular buffer to prevent memory leak
                if (userData.playerPositionHistory.length > ECHO_GUARD_HISTORY_LENGTH) {
                    userData.playerPositionHistory.shift();
                }
                // Move to where player was ECHO_GUARD_HISTORY_LENGTH frames ago
                if (userData.playerPositionHistory.length >= ECHO_GUARD_HISTORY_LENGTH) {
                    const echoTarget = userData.playerPositionHistory[0];
                    const dir = new THREE.Vector3().subVectors(echoTarget, guard.position).normalize();
                    guard.position.add(dir.multiplyScalar(userData.speed * 1.5 * gameState.timeWarp));
                }
            } else if (userData.guardType === 'void') {
                // Void Architects actively rebuild rooms
                const now = Date.now();
                if (now - userData.lastRoomChangeTime > 5000) {
                    userData.lastRoomChangeTime = now;
                    // Trigger room rebuild (spawn new platform)
                    this.voidArchitectRebuild(guard);
                }
            }
            
            // Basic patrol behavior for all guards
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

            // Enhanced detection logic with prediction
            const distanceToPlayer = guard.position.distanceTo(playerPosition);
            if (distanceToPlayer < 12) {
                // Calculate if player is in vision cone
                const toPlayer = new THREE.Vector3()
                    .subVectors(playerPosition, guard.position)
                    .normalize();
                const forwardDir = new THREE.Vector3(0, 0, -1)
                    .applyQuaternion(guard.quaternion);
                const angle = toPlayer.dot(forwardDir);
                
                if (angle > 0.7) { // Within 45-degree cone
                    userData.alertLevel = Math.min(100, userData.alertLevel + 3);
                    guard.material.emissiveIntensity = 0.3 + (userData.alertLevel / 100) * 0.7;
                    
                    if (userData.alertLevel > 50) {
                        // Cinematic chase behavior with prediction
                        const playerVelocity = gameState.velocity.clone();
                        const predictedPos = playerPosition.clone().add(playerVelocity.multiplyScalar(2));
                        const chaseDir = new THREE.Vector3()
                            .subVectors(predictedPos, guard.position)
                            .normalize();
                        guard.position.add(chaseDir.multiplyScalar(userData.speed * 2.5 * gameState.timeWarp));
                        
                        // Damage player if close
                        if (distanceToPlayer < 2) {
                            gameState.health = Math.max(0, gameState.health - 0.5);
                            // Structural damage on collision
                            gameState.structuralIntegrity = Math.max(0, gameState.structuralIntegrity - 0.3);
                        }
                    }
                } else {
                    userData.alertLevel = Math.max(0, userData.alertLevel - 1);
                    guard.material.emissiveIntensity = 0.3;
                }
            }
        });
    }
    
    voidArchitectRebuild(guard) {
        // Void Architect spawns a temporary platform
        const geometry = new THREE.BoxGeometry(5, 0.5, 5);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0088,
            emissive: 0xff0088,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
        });
        const platform = new THREE.Mesh(geometry, material);
        platform.position.copy(guard.position);
        platform.position.y -= 1;
        platform.userData = { type: 'temporary', lifetime: 10000, spawnTime: Date.now() };
        scene.add(platform);
        this.dynamicElements.push(platform);
    }
    
    updateDynamicElements() {
        // Update sliding walls
        this.dynamicElements.forEach((element, index) => {
            if (element.userData.type === 'wall' && element.userData.canSlide) {
                element.userData.slideOffset += element.userData.slideSpeed * element.userData.slideDirection;
                if (Math.abs(element.userData.slideOffset) > element.userData.slideRange) {
                    element.userData.slideDirection *= -1;
                }
                element.position.y = element.position.y + element.userData.slideSpeed * element.userData.slideDirection * gameState.timeWarp;
            }
            
            // Remove temporary platforms
            if (element.userData.type === 'temporary') {
                const age = Date.now() - element.userData.spawnTime;
                if (age > element.userData.lifetime) {
                    scene.remove(element);
                    element.geometry.dispose();
                    element.material.dispose();
                    this.dynamicElements.splice(index, 1);
                } else {
                    // Fade out near end of lifetime
                    element.material.opacity = Math.max(0, 0.7 * (1 - age / element.userData.lifetime));
                }
            }
        });
        
        // Update dissolving platforms
        this.platforms.forEach(platform => {
            if (platform.userData.canDissolve) {
                // Check if player is on platform
                const playerPos = camera.position;
                const platformTop = platform.position.y + platform.geometry.parameters.height / 2;
                const maxRadius = Math.max(
                    platform.geometry.parameters.width,
                    platform.geometry.parameters.depth
                ) / 2;
                const horizontalDist = Math.sqrt(
                    Math.pow(playerPos.x - platform.position.x, 2) +
                    Math.pow(playerPos.z - platform.position.z, 2)
                );
                
                if (horizontalDist < maxRadius && Math.abs(playerPos.y - platformTop) < 3) {
                    platform.userData.dissolveProgress += 0.01 * gameState.timeWarp;
                    platform.material.opacity = Math.max(0.2, 1 - platform.userData.dissolveProgress);
                    platform.material.transparent = true;
                    
                    if (platform.userData.dissolveProgress > 0.8) {
                        // Platform collapses
                        gameState.structuralIntegrity = Math.max(0, gameState.structuralIntegrity - 1);
                    }
                }
            }
            
            // Animate sliding platforms
            if (platform.userData.canSlide) {
                platform.position.add(platform.userData.slideDirection.clone().multiplyScalar(gameState.timeWarp));
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
         ...this.timeZones, ...this.aiGuards, ...this.dynamicElements,
         ...this.timeFractureZones].forEach(obj => {
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
        this.dynamicElements = [];
        this.timeFractureZones = [];
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
    
    // Reset player position and state
    camera.position.set(0, 5, 0);
    gameState.velocity.set(0, 0, 0);
    gameState.gravity.set(0, -1, 0);
    gameState.gravityMagnitude = 1.0;
    gameState.loot = 0;
    gameState.health = 100;
    gameState.structuralIntegrity = 100;
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

// Check collisions with zones - Enhanced for directional gravity
function checkZones() {
    const playerPos = camera.position;
    
    // Reset to defaults
    gameState.gravity.set(0, -1, 0);
    gameState.gravityMagnitude = 1.0;
    gameState.timeWarp = 1.0;
    
    // Check gravity zones with directional gravity
    world.gravityZones.forEach(zone => {
        const distance = new THREE.Vector2(
            playerPos.x - zone.position.x,
            playerPos.z - zone.position.z
        ).length();
        
        if (distance < 5 && Math.abs(playerPos.y - zone.position.y) < 10) {
            gameState.gravity.copy(zone.userData.gravityVector);
            gameState.gravityMagnitude = zone.userData.gravityVector.length();
            document.getElementById('gravity').textContent = `Gravity: ${zone.userData.name}`;
        }
    });
    
    // Check for Sentinel Warden gravity fields
    world.aiGuards.forEach(guard => {
        if (guard.userData.guardType === 'sentinel' && guard.userData.gravityField) {
            const distToGuard = guard.position.distanceTo(playerPos);
            if (distToGuard < 15) {
                // Blend gravity fields
                const influence = 1 - (distToGuard / 15);
                gameState.gravity.lerp(guard.userData.gravityField, influence * 0.5);
            }
        }
    });
    
    // Check time fracture zones with enhanced effects
    world.timeZones.forEach(zone => {
        const distance = playerPos.distanceTo(zone.position);
        
        if (distance < 5) {
            gameState.timeWarp = zone.userData.timeWarp;
            document.getElementById('timeWarp').textContent = `Time: ${zone.userData.name}`;
            
            // Animate time zone pulsing
            if (zone.userData.pulsePhase !== undefined) {
                zone.userData.pulsePhase += 0.05;
                zone.material.opacity = 0.3 + Math.sin(zone.userData.pulsePhase) * 0.2;
            }
        }
    });
    
    if (gameState.gravityMagnitude === 1.0 && gameState.gravity.y === -1) {
        document.getElementById('gravity').textContent = 'Gravity: NORMAL';
    }
    if (gameState.timeWarp === 1.0) {
        document.getElementById('timeWarp').textContent = 'Time: NORMAL';
    }
}

// Check loot collection - Enhanced with physics-based destruction
function checkLootCollection() {
    const playerPos = camera.position;
    
    world.lootItems.forEach((loot, index) => {
        if (loot.visible) {
            const distance = playerPos.distanceTo(loot.position);
            
            if (distance < 2.5) {
                // Collect loot
                loot.visible = false;
                gameState.loot++;
                
                // Heavy loot causes structural damage
                const mass = loot.userData.mass;
                if (mass > 20) {
                    gameState.structuralIntegrity = Math.max(0, gameState.structuralIntegrity - loot.userData.destructionValue);
                    cameraShake.intensity = 0.5 + (mass / 100);
                    
                    // Trigger platform destruction
                    triggerPlatformDestruction(loot.position, loot.userData.destructionValue);
                } else {
                    cameraShake.intensity = 0.2;
                }
                
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

function triggerPlatformDestruction(position, destructionValue) {
    // Find nearby platforms and damage them
    world.platforms.forEach(platform => {
        const dist = platform.position.distanceTo(position);
        if (dist < 10 && platform.userData.structural) {
            // Create destruction particles
            createDestructionParticles(platform.position);
            
            if (destructionValue > 30 && platform.userData.canDissolve) {
                platform.userData.dissolveProgress = Math.min(1, platform.userData.dissolveProgress + 0.3);
            }
        }
    });
}

function createDestructionParticles(position) {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(position.x, position.y, position.z);
        velocities.push(
            (Math.random() - 0.5) * 0.8,
            Math.random() * 0.8,
            (Math.random() - 0.5) * 0.8
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xff4400,
        size: 0.4,
        transparent: true
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities, lifetime: PARTICLE_LIFETIME };
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
        particles.material.opacity *= 0.97;
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

// Ground collision check - Enhanced for directional gravity
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
            // Check if player is at platform height (works for normal gravity)
            if (Math.abs(gameState.gravity.y) > VERTICAL_GRAVITY_THRESHOLD) {
                if (playerPos.y <= platformTop + 2 && playerPos.y >= platformTop) {
                    playerPos.y = platformTop + 2;
                    gameState.velocity.y = 0;
                    onGround = true;
                }
            }
        }
    });
    
    gameState.canJump = onGround;
    
    // Fall detection
    if (playerPos.y < -50) {
        gameState.health = Math.max(0, gameState.health - 20);
        playerPos.set(0, 5, 0);
        gameState.velocity.set(0, 0, 0);
        cameraShake.intensity = 1.0;
    }
}

// Animation loop - Enhanced for Black Vaults
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.isPlaying) return;
    
    const delta = 0.016 * gameState.timeWarp; // Fixed timestep with time warp
    
    // Update AI
    world.updateAI(camera.position);
    
    // Update particles
    world.updateParticles();
    
    // Update dynamic elements (sliding walls, dissolving floors)
    world.updateDynamicElements();
    
    // Rotate loot with enhanced animation
    world.lootItems.forEach(loot => {
        loot.rotation.y += loot.userData.rotationSpeed * gameState.timeWarp;
        loot.rotation.x += loot.userData.rotationSpeed * 0.5 * gameState.timeWarp;
        loot.position.y += Math.sin(Date.now() * 0.001 + loot.userData.rotation) * 0.015;
    });
    
    // Apply directional physics
    if (controls.isLocked) {
        // Apply directional gravity (vector-based)
        const gravityForce = gameState.gravity.clone().multiplyScalar(0.5 * gameState.gravityMagnitude * delta);
        gameState.velocity.add(gravityForce);
        
        // Apply velocity to position
        camera.position.add(gameState.velocity.clone().multiplyScalar(delta));
        
        // Check collisions
        checkGroundCollision();
        checkZones();
        checkLootCollection();
        
        // Movement with gravity rotation support
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
        
        // Jump with directional gravity
        if (moveState.jump && gameState.canJump) {
            // Jump opposite to gravity direction
            const jumpForce = gameState.gravity.clone().normalize().multiplyScalar(-10);
            gameState.velocity.add(jumpForce);
            gameState.canJump = false;
        }
        
        // Gravity rotation controls (Q and E keys)
        if (moveState.rotateGravityLeft) {
            gameState.gravityRotation += GRAVITY_ROTATION_SPEED;
            const angle = gameState.gravityRotation;
            gameState.gravity.set(Math.sin(angle), -Math.cos(angle), 0);
        }
        if (moveState.rotateGravityRight) {
            gameState.gravityRotation -= GRAVITY_ROTATION_SPEED;
            const angle = gameState.gravityRotation;
            gameState.gravity.set(Math.sin(angle), -Math.cos(angle), 0);
        }
    }
    
    // Cinematic camera effects
    applyCameraShake();
    
    // Update HUD with enhanced info
    document.getElementById('health').textContent = `Health: ${Math.floor(gameState.health)}`;
    
    // Check structural integrity - environment collapses
    if (gameState.structuralIntegrity < 50) {
        // Visual feedback for collapsing environment
        cameraShake.intensity = Math.max(cameraShake.intensity, (50 - gameState.structuralIntegrity) * 0.02);
    }
    
    // Check game over
    if (gameState.health <= 0 || gameState.structuralIntegrity <= 0) {
        // Reset all game state for clean respawn
        gameState.health = 100;
        gameState.structuralIntegrity = 100;
        gameState.gravity.set(0, -1, 0);
        gameState.gravityMagnitude = 1.0;
        gameState.gravityRotation = 0;
        camera.position.set(0, 5, 0);
        gameState.velocity.set(0, 0, 0);
        cameraShake.intensity = 2.0;
    }
    
    renderer.render(scene, camera);
}

// Input handling - Enhanced with gravity rotation
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
        case 'Space': moveState.jump = true; break;
        case 'ShiftLeft': moveState.sprint = true; break;
        case 'KeyQ': moveState.rotateGravityLeft = true; break;
        case 'KeyE': moveState.rotateGravityRight = true; break;
        case 'KeyR': moveState.useAbility = true; break;
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
        case 'KeyQ': moveState.rotateGravityLeft = false; break;
        case 'KeyE': moveState.rotateGravityRight = false; break;
        case 'KeyR': moveState.useAbility = false; break;
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
