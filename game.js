import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Physics constants
const GRAVITY = 25; // Gravity magnitude in units/s^2
const PLAYER_HEIGHT = 1.8; // Capsule collider height
const PLAYER_RADIUS = 0.35; // Capsule collider radius
const FIXED_TIMESTEP = 1/60; // Fixed timestep: 16.67ms per frame
const GRAVITY_ROTATION_COOLDOWN = 0.6; // Seconds between gravity rotations
const CAMERA_LERP_DURATION = 0.4; // Camera interpolation duration in seconds
const AIR_CONTROL_FACTOR = 0.4; // Air control is 40% of ground control

// World generation constants
const ROOM_SIZE = 10; // Each room is 10×10×10 units
const GRID_SIZE = 3; // 3×3 grid of rooms
const CORRIDOR_WIDTH = 2; // Width of corridors connecting rooms
const VOID_FALL_DISTANCE = 25; // Distance from room center to trigger reset

// Other constants
const PARTICLE_LIFETIME = 80;
const VERTICAL_GRAVITY_THRESHOLD = 0.5;
const ECHO_GUARD_HISTORY_LENGTH = 60;

// Game state - Enhanced for Black Vaults
const gameState = {
    level: 1,
    loot: 0,
    lootRequired: 10,
    health: 100,
    gravityDir: new THREE.Vector3(0, -1, 0), // Normalized gravity direction vector
    timeWarp: 1.0,
    isPlaying: false,
    levelComplete: false,
    velocity: new THREE.Vector3(0, 0, 0), // 3D velocity for physics
    canJump: false,
    lastGravityRotation: 0, // Timestamp of last gravity rotation
    cameraLerpProgress: 1, // 0 to 1, tracks camera interpolation
    cameraTargetUp: new THREE.Vector3(0, 1, 0), // Target "up" vector for camera
    cameraCurrentUp: new THREE.Vector3(0, 1, 0), // Current interpolated "up" vector
    cinematicMode: false,
    structuralIntegrity: 100, // For destructible environments
    accumulator: 0 // For fixed timestep accumulator
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
    jump: false
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

// Procedural world generation - Modular room system
class ProceduralWorld {
    constructor(seed) {
        this.seed = seed;
        this.rooms = []; // 3×3 grid of rooms
        this.corridors = []; // Connecting corridors
        this.lootItems = [];
        this.particles = [];
    }

    random() {
        // Simple seeded random (Linear Congruential Generator)
        // Formula: seed = (seed * a + c) % m
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    generateModularRooms() {
        // Generate 9 rooms arranged in 3×3 grid
        // Grid layout (each cell is a 10×10×10 room):
        //   (0,2) (1,2) (2,2)
        //   (0,1) (1,1) (2,1)
        //   (0,0) (1,0) (2,0)
        // Center room (1,1) is at world origin (0,0,0)
        for (let gridX = 0; gridX < GRID_SIZE; gridX++) {
            for (let gridZ = 0; gridZ < GRID_SIZE; gridZ++) {
                this.generateRoom(gridX, gridZ);
            }
        }
        
        // Generate corridors between adjacent rooms
        // Corridors connect through doorway openings in walls
        this.generateCorridors();
    }
    
    generateRoom(gridX, gridZ) {
        // Calculate room center position in world space
        // Grid to world conversion: worldPos = (gridPos - 1) * ROOM_SIZE
        // Examples:
        //   grid (0,0) → world (-10, 0, -10)
        //   grid (1,1) → world (  0, 0,   0) [center]
        //   grid (2,2) → world ( 10, 0,  10)
        const roomX = (gridX - 1) * ROOM_SIZE; // Center grid at origin
        const roomZ = (gridZ - 1) * ROOM_SIZE;
        const roomY = 0; // All rooms at same Y level
        
        const roomGroup = new THREE.Group();
        roomGroup.position.set(roomX, roomY, roomZ);
        
        // Create floor (10×10, positioned at bottom of room)
        const floorGeometry = new THREE.BoxGeometry(ROOM_SIZE, 0.5, ROOM_SIZE);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x0088ff,
            emissive: 0x002244,
            metalness: 0.7,
            roughness: 0.3
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -ROOM_SIZE / 2; // Bottom of room
        floor.receiveShadow = true;
        floor.castShadow = true;
        floor.userData = { type: 'floor', roomId: `${gridX},${gridZ}` };
        roomGroup.add(floor);
        
        // Create ceiling (10×10, positioned at top of room)
        const ceilingGeometry = new THREE.BoxGeometry(ROOM_SIZE, 0.5, ROOM_SIZE);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x004488,
            emissive: 0x001122,
            metalness: 0.7,
            roughness: 0.3
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = ROOM_SIZE / 2; // Top of room
        ceiling.receiveShadow = true;
        ceiling.castShadow = true;
        ceiling.userData = { type: 'ceiling', roomId: `${gridX},${gridZ}` };
        roomGroup.add(ceiling);
        
        // Create walls (4 walls, leaving doorway openings)
        this.generateWalls(roomGroup, gridX, gridZ);
        
        // Add neon edge outlines
        this.addRoomEdges(roomGroup);
        
        scene.add(roomGroup);
        this.rooms.push({
            group: roomGroup,
            gridX: gridX,
            gridZ: gridZ,
            center: new THREE.Vector3(roomX, roomY, roomZ),
            floor: floor,
            ceiling: ceiling
        });
    }
    
    generateWalls(roomGroup, gridX, gridZ) {
        // Wall thickness
        const wallThickness = 0.5;
        const wallHeight = ROOM_SIZE;
        
        // North wall (+Z direction)
        const hasNorthDoor = gridZ < GRID_SIZE - 1;
        this.createWall(roomGroup, 0, 0, ROOM_SIZE / 2, ROOM_SIZE, wallThickness, hasNorthDoor, 'north');
        
        // South wall (-Z direction)
        const hasSouthDoor = gridZ > 0;
        this.createWall(roomGroup, 0, 0, -ROOM_SIZE / 2, ROOM_SIZE, wallThickness, hasSouthDoor, 'south');
        
        // East wall (+X direction)
        const hasEastDoor = gridX < GRID_SIZE - 1;
        this.createWall(roomGroup, ROOM_SIZE / 2, 0, 0, wallThickness, ROOM_SIZE, hasEastDoor, 'east');
        
        // West wall (-X direction)
        const hasWestDoor = gridX > 0;
        this.createWall(roomGroup, -ROOM_SIZE / 2, 0, 0, wallThickness, ROOM_SIZE, hasWestDoor, 'west');
    }
    
    createWall(roomGroup, x, y, z, width, depth, hasDoorway, direction) {
        const wallHeight = ROOM_SIZE;
        const doorwayWidth = CORRIDOR_WIDTH;
        
        if (hasDoorway) {
            // Create two wall segments with doorway in middle
            const segmentWidth = direction === 'north' || direction === 'south' ? 
                (ROOM_SIZE - doorwayWidth) / 2 : width;
            const segmentDepth = direction === 'east' || direction === 'west' ? 
                (ROOM_SIZE - doorwayWidth) / 2 : depth;
            
            if (direction === 'north' || direction === 'south') {
                // Horizontal wall, split left and right
                const offset = (ROOM_SIZE - doorwayWidth) / 4 + doorwayWidth / 2;
                this.createWallSegment(roomGroup, x - offset, y, z, segmentWidth, depth, wallHeight);
                this.createWallSegment(roomGroup, x + offset, y, z, segmentWidth, depth, wallHeight);
            } else {
                // Vertical wall, split front and back
                const offset = (ROOM_SIZE - doorwayWidth) / 4 + doorwayWidth / 2;
                this.createWallSegment(roomGroup, x, y, z - offset, width, segmentDepth, wallHeight);
                this.createWallSegment(roomGroup, x, y, z + offset, width, segmentDepth, wallHeight);
            }
        } else {
            // Solid wall, no doorway
            this.createWallSegment(roomGroup, x, y, z, width, depth, wallHeight);
        }
    }
    
    createWallSegment(roomGroup, x, y, z, width, depth, height) {
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x4444ff,
            emissive: 0x000044,
            emissiveIntensity: 0.5,
            metalness: 0.9,
            roughness: 0.1
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        wall.userData = { type: 'wall' };
        roomGroup.add(wall);
    }
    
    addRoomEdges(roomGroup) {
        // Add neon wireframe edges to entire room
        const edgesGeometry = new THREE.EdgesGeometry(
            new THREE.BoxGeometry(ROOM_SIZE, ROOM_SIZE, ROOM_SIZE)
        );
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            linewidth: 2
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        roomGroup.add(edges);
    }
    
    generateCorridors() {
        // Generate corridors connecting adjacent rooms
        for (let gridX = 0; gridX < GRID_SIZE; gridX++) {
            for (let gridZ = 0; gridZ < GRID_SIZE; gridZ++) {
                // Horizontal corridor (connects to east neighbor)
                if (gridX < GRID_SIZE - 1) {
                    this.createCorridor(gridX, gridZ, 'horizontal');
                }
                
                // Vertical corridor (connects to north neighbor)
                if (gridZ < GRID_SIZE - 1) {
                    this.createCorridor(gridX, gridZ, 'vertical');
                }
            }
        }
    }
    
    createCorridor(gridX, gridZ, direction) {
        const roomX = (gridX - 1) * ROOM_SIZE;
        const roomZ = (gridZ - 1) * ROOM_SIZE;
        
        let corridorGeometry;
        let corridorX, corridorZ;
        
        if (direction === 'horizontal') {
            // Connects to east neighbor
            corridorX = roomX + ROOM_SIZE / 2;
            corridorZ = roomZ;
            // Corridor spans the gap between rooms
            corridorGeometry = new THREE.BoxGeometry(ROOM_SIZE, CORRIDOR_WIDTH, CORRIDOR_WIDTH);
        } else {
            // Connects to north neighbor
            corridorX = roomX;
            corridorZ = roomZ + ROOM_SIZE / 2;
            corridorGeometry = new THREE.BoxGeometry(CORRIDOR_WIDTH, CORRIDOR_WIDTH, ROOM_SIZE);
        }
        
        const corridorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x008888,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
        corridor.position.set(corridorX, -ROOM_SIZE / 2 + CORRIDOR_WIDTH / 2, corridorZ);
        corridor.castShadow = true;
        corridor.receiveShadow = true;
        corridor.userData = { type: 'corridor' };
        
        scene.add(corridor);
        this.corridors.push(corridor);
    }

    generateLoot() {
        // Place loot items in random rooms
        for (let i = 0; i < gameState.lootRequired; i++) {
            const lootSize = 0.3 + this.random() * 0.4;
            const geometry = new THREE.OctahedronGeometry(lootSize);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.7,
                metalness: 0.9,
                roughness: 0.1
            });
            
            const loot = new THREE.Mesh(geometry, material);
            
            // Place loot in a random room
            const roomIndex = Math.floor(this.random() * this.rooms.length);
            const room = this.rooms[roomIndex];
            
            // Position loot at random location within room
            loot.position.copy(room.center);
            loot.position.x += (this.random() - 0.5) * (ROOM_SIZE - 2);
            loot.position.y += 1; // Hover above floor
            loot.position.z += (this.random() - 0.5) * (ROOM_SIZE - 2);
            
            loot.userData = { 
                type: 'loot',
                rotation: this.random() * Math.PI * 2,
                rotationSpeed: 0.01 + this.random() * 0.02
            };
            
            scene.add(loot);
            this.lootItems.push(loot);

            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(lootSize * 1.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.4
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            loot.add(glow);
        }
    }

    clear() {
        // Remove all generated objects
        this.rooms.forEach(room => {
            scene.remove(room.group);
            room.group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        
        this.corridors.forEach(corridor => {
            scene.remove(corridor);
            if (corridor.geometry) corridor.geometry.dispose();
            if (corridor.material) corridor.material.dispose();
        });
        
        this.lootItems.forEach(loot => {
            scene.remove(loot);
            if (loot.geometry) loot.geometry.dispose();
            if (loot.material) loot.material.dispose();
        });
        
        this.rooms = [];
        this.corridors = [];
        this.lootItems = [];
        this.particles = [];
    }
}

// Initialize world
let world = new ProceduralWorld(Date.now());

function generateLevel() {
    world.clear();
    world = new ProceduralWorld(Date.now() + gameState.level * 1000);
    world.generateModularRooms();
    world.generateLoot();
    
    // Reset player position to center room (grid position 1,1)
    camera.position.set(0, -ROOM_SIZE / 2 + PLAYER_HEIGHT, 0);
    gameState.velocity.set(0, 0, 0);
    gameState.gravityDir.set(0, -1, 0);
    gameState.cameraTargetUp.set(0, 1, 0);
    gameState.cameraCurrentUp.set(0, 1, 0);
    gameState.cameraLerpProgress = 1;
    gameState.loot = 0;
    gameState.health = 100;
    gameState.structuralIntegrity = 100;
}

// Gravity rotation functions
// Rotate gravity 90° left (Q key) or right (E key) around camera forward axis
function rotateGravityLeft() {
    const now = performance.now() / 1000;
    
    // Check cooldown: 0.6 seconds since last rotation
    // if (currentTime - lastRotationTime < cooldown) then skip
    if (now - gameState.lastGravityRotation < GRAVITY_ROTATION_COOLDOWN) {
        return; // Still in cooldown
    }
    
    // Get camera forward direction (normalized)
    // forward = camera.direction / |camera.direction|
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.normalize(); // Ensure unit vector: |forward| = 1
    
    // Rotate current gravity 90° counter-clockwise around forward axis
    // Using Rodrigues' rotation formula:
    // v' = v*cos(θ) + (k×v)*sin(θ) + k*(k·v)*(1-cos(θ))
    // Where:
    //   v = input vector (gravityDir)
    //   k = axis of rotation (forward)
    //   θ = rotation angle (90°)
    //   × = cross product
    //   · = dot product
    // For 90° rotation: cos(90°) = 0, sin(90°) = 1
    // Simplified: v' = (k×v) + k*(k·v)
    const angle = Math.PI / 2; // 90 degrees in radians
    const newGravity = gameState.gravityDir.clone();
    newGravity.applyAxisAngle(forward, angle); // Apply Rodrigues' formula
    newGravity.normalize(); // Ensure unit vector: |newGravity| = 1
    
    gameState.gravityDir.copy(newGravity);
    gameState.lastGravityRotation = now;
    
    // Start camera interpolation
    // New "up" vector is opposite to gravity
    // up = -gravity = gravity * (-1)
    gameState.cameraTargetUp.copy(newGravity).multiplyScalar(-1);
    gameState.cameraLerpProgress = 0; // Reset lerp progress (0 = start, 1 = end)
}

function rotateGravityRight() {
    const now = performance.now() / 1000;
    
    // Check cooldown: 0.6 seconds since last rotation
    // if (currentTime - lastRotationTime < cooldown) then skip
    if (now - gameState.lastGravityRotation < GRAVITY_ROTATION_COOLDOWN) {
        return; // Still in cooldown
    }
    
    // Get camera forward direction (normalized)
    // forward = camera.direction / |camera.direction|
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.normalize(); // Ensure unit vector: |forward| = 1
    
    // Rotate current gravity 90° clockwise around forward axis
    // Using Rodrigues' rotation formula (see rotateGravityLeft for details)
    // Clockwise = negative angle
    const angle = -Math.PI / 2; // -90 degrees in radians
    const newGravity = gameState.gravityDir.clone();
    newGravity.applyAxisAngle(forward, angle); // Apply Rodrigues' formula
    newGravity.normalize(); // Ensure unit vector: |newGravity| = 1
    
    gameState.gravityDir.copy(newGravity);
    gameState.lastGravityRotation = now;
    
    // Start camera interpolation
    // New "up" vector is opposite to gravity
    // up = -gravity = gravity * (-1)
    gameState.cameraTargetUp.copy(newGravity).multiplyScalar(-1);
    gameState.cameraLerpProgress = 0; // Reset lerp progress (0 = start, 1 = end)
}

// Update camera orientation to smoothly interpolate to new "up" vector
function updateCameraOrientation(deltaTime) {
    if (gameState.cameraLerpProgress < 1) {
        // Increment lerp progress based on time
        // Duration is 0.4 seconds, so progress increases by deltaTime / 0.4
        // progress(t) = progress(t-1) + Δt / duration
        // When progress reaches 1.0, interpolation is complete
        gameState.cameraLerpProgress += deltaTime / CAMERA_LERP_DURATION;
        gameState.cameraLerpProgress = Math.min(1, gameState.cameraLerpProgress); // Clamp to [0, 1]
        
        // Linear interpolation (LERP) for smooth rotation
        // lerp(a, b, t) = a + (b - a) * t = a*(1-t) + b*t
        // Where:
        //   a = current up vector
        //   b = target up vector
        //   t = interpolation factor [0, 1]
        gameState.cameraCurrentUp.copy(gameState.cameraCurrentUp)
            .lerp(gameState.cameraTargetUp, gameState.cameraLerpProgress);
        gameState.cameraCurrentUp.normalize(); // Ensure unit vector: |up| = 1
        
        // Apply the new up vector to camera
        // Note: This is a simplified version. Full implementation would use quaternions
        // for proper camera reorientation
    }
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

// Check loot collection
function checkLootCollection() {
    const playerPos = camera.position;
    
    world.lootItems.forEach((loot, index) => {
        if (loot.visible) {
            const distance = playerPos.distanceTo(loot.position);
            
            if (distance < 2.5) {
                // Collect loot
                loot.visible = false;
                gameState.loot++;
                cameraShake.intensity = 0.2;
                
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

// Check if player fell into void (25 units from any room center)
function checkVoidFall() {
    const playerPos = camera.position;
    let inRoom = false;
    
    // Check if player is within VOID_FALL_DISTANCE units of any room center
    // For each room, calculate: distance = |playerPos - roomCenter|
    // If distance < VOID_FALL_DISTANCE for any room, player is safe
    for (const room of world.rooms) {
        // Euclidean distance: d = sqrt((x1-x2)² + (y1-y2)² + (z1-z2)²)
        const distToRoomCenter = playerPos.distanceTo(room.center);
        if (distToRoomCenter < VOID_FALL_DISTANCE) {
            inRoom = true;
            break;
        }
    }
    
    if (!inRoom) {
        // Fell into void - reset level
        gameState.health = Math.max(0, gameState.health - 20); // Damage: max(0, health - 20)
        // Reset player position to starting room (center grid position 1,1 = world 0,0,0)
        camera.position.set(0, -ROOM_SIZE / 2 + PLAYER_HEIGHT, 0);
        gameState.velocity.set(0, 0, 0); // Clear all velocity
        cameraShake.intensity = 1.0; // Trigger camera shake effect
    }
}

// Ground collision check with capsule collider
// Player is a capsule: height = 1.8, radius = 0.35
function checkGroundCollision() {
    let onGround = false;
    const playerPos = camera.position;
    
    // Check collision with all room floors
    world.rooms.forEach(room => {
        const floor = room.floor;
        // Calculate world position of floor top surface
        // floorTop = roomY + floorY + floorHeight/2
        const floorTop = room.group.position.y + floor.position.y + floor.geometry.parameters.height / 2;
        
        // Check if player capsule bottom is near floor
        // Capsule geometry: bottom sphere center = playerPos.y - (height - radius)
        // For simplicity, we use: capsuleBottom = playerPos.y - height/2
        const capsuleBottom = playerPos.y - PLAYER_HEIGHT / 2;
        
        // Check horizontal distance to floor center (2D distance in XZ plane)
        // distance = sqrt((x1-x2)² + (z1-z2)²)
        const floorCenterX = room.group.position.x + floor.position.x;
        const floorCenterZ = room.group.position.z + floor.position.z;
        const horizontalDist = Math.sqrt(
            Math.pow(playerPos.x - floorCenterX, 2) +
            Math.pow(playerPos.z - floorCenterZ, 2)
        );
        
        // Check if within floor bounds (accounting for capsule radius)
        // Player can be on floor if: horizontalDist < floorRadius - capsuleRadius
        if (horizontalDist < ROOM_SIZE / 2 - PLAYER_RADIUS) {
            // Check vertical collision: is capsule bottom touching floor top?
            // Collision if: capsuleBottom ≤ floorTop AND capsuleBottom ≥ floorTop - threshold
            if (capsuleBottom <= floorTop && capsuleBottom >= floorTop - 0.5) {
                // Collision! Place player on floor
                // Resolve collision: playerPos.y = floorTop + height/2
                playerPos.y = floorTop + PLAYER_HEIGHT / 2;
                // Stop downward velocity (can't fall through floor)
                if (gameState.velocity.y < 0) {
                    gameState.velocity.y = 0;
                }
                onGround = true;
            }
        }
    });
    
    // Check collision with corridors (same logic as floors)
    world.corridors.forEach(corridor => {
        const corridorTop = corridor.position.y + corridor.geometry.parameters.height / 2;
        const capsuleBottom = playerPos.y - PLAYER_HEIGHT / 2;
        
        // Get corridor dimensions
        const corridorWidth = corridor.geometry.parameters.width;
        const corridorDepth = corridor.geometry.parameters.depth;
        
        // Check if within corridor bounds (AABB collision)
        // |dx| < width/2 AND |dz| < depth/2 (accounting for capsule radius)
        const dx = Math.abs(playerPos.x - corridor.position.x);
        const dz = Math.abs(playerPos.z - corridor.position.z);
        
        if (dx < corridorWidth / 2 - PLAYER_RADIUS && dz < corridorDepth / 2 - PLAYER_RADIUS) {
            if (capsuleBottom <= corridorTop && capsuleBottom >= corridorTop - 0.5) {
                playerPos.y = corridorTop + PLAYER_HEIGHT / 2;
                if (gameState.velocity.y < 0) {
                    gameState.velocity.y = 0;
                }
                onGround = true;
            }
        }
    });
    
    gameState.canJump = onGround;
}

// Fixed timestep game loop
// Previous frame timestamp for delta calculation
let lastFrameTime = performance.now() / 1000;

function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.isPlaying) return;
    
    // Calculate frame time (variable, depends on display refresh rate)
    // frameTime = currentTime - lastTime
    const currentTime = performance.now() / 1000; // Convert ms to seconds
    let frameTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    // Cap frame time to prevent spiral of death
    // If frame takes too long (>250ms), cap it to avoid huge physics jumps
    if (frameTime > 0.25) {
        frameTime = 0.25;
    }
    
    // Add frame time to accumulator
    // Accumulator stores "leftover" time that hasn't been simulated yet
    gameState.accumulator += frameTime;
    
    // Fixed timestep loop: process physics in fixed FIXED_TIMESTEP increments
    // While there's enough time in accumulator for a full physics step:
    //   1. Run physics for FIXED_TIMESTEP (1/60 = 0.01667s)
    //   2. Subtract FIXED_TIMESTEP from accumulator
    // This ensures physics runs at constant 60 Hz regardless of frame rate
    while (gameState.accumulator >= FIXED_TIMESTEP) {
        updatePhysics(FIXED_TIMESTEP); // Physics update with delta = 1/60
        gameState.accumulator -= FIXED_TIMESTEP; // Remove simulated time
    }
    // Note: Remaining time in accumulator carries over to next frame
    
    // Update camera orientation interpolation (visual only, not physics)
    updateCameraOrientation(frameTime);
    
    // Update visual effects (loot rotation, particles, etc.)
    updateVisuals();
    
    // Cinematic camera effects (screen shake)
    applyCameraShake();
    
    // Update HUD text
    updateHUD();
    
    // Render the scene
    renderer.render(scene, camera);
}

// Physics update with fixed timestep
function updatePhysics(delta) {
    if (!controls.isLocked) return;
    
    // Apply gravity force to velocity
    // Newton's second law: F = ma, where m = 1 (unit mass)
    // Acceleration: a = F/m = F = gravityDir * GRAVITY
    // Velocity integration (Euler method): v(t+Δt) = v(t) + a*Δt
    // Where:
    //   v = velocity vector
    //   a = acceleration = gravityDir * GRAVITY
    //   Δt = delta time (FIXED_TIMESTEP = 1/60)
    const gravityAccel = gameState.gravityDir.clone().multiplyScalar(GRAVITY * delta);
    gameState.velocity.add(gravityAccel); // v_new = v_old + a*Δt
    
    // Apply velocity to position
    // Position integration (Euler method): p(t+Δt) = p(t) + v*Δt
    // Where:
    //   p = position vector
    //   v = velocity vector
    //   Δt = delta time
    const velocityDelta = gameState.velocity.clone().multiplyScalar(delta);
    camera.position.add(velocityDelta); // p_new = p_old + v*Δt
    
    // Check collisions
    checkGroundCollision();
    checkVoidFall();
    checkLootCollection();
    
    // Process movement input
    // Movement is projected onto gravity-orthogonal plane
    processMovement(delta);
}

// Process player movement projected onto gravity-orthogonal plane
function processMovement(delta) {
    // Get movement direction in camera space
    const moveDir = new THREE.Vector3();
    const forward = Number(moveState.forward) - Number(moveState.backward); // -1, 0, or 1
    const right = Number(moveState.right) - Number(moveState.left); // -1, 0, or 1
    
    if (forward === 0 && right === 0) return; // No movement input
    
    // Get camera forward and right vectors
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    camera.getWorldDirection(cameraForward); // Forward = direction camera is facing
    // Right vector = forward × up (cross product)
    // Cross product: a × b = vector perpendicular to both a and b
    cameraRight.crossVectors(cameraForward, camera.up).normalize();
    
    // Combine forward and right movement
    // moveDir = forward*cameraForward + right*cameraRight
    moveDir.addScaledVector(cameraForward, forward); // Add forward component
    moveDir.addScaledVector(cameraRight, right); // Add right component
    moveDir.normalize(); // Ensure unit vector: |moveDir| = 1
    
    // Project movement onto gravity-orthogonal plane
    // For a plane with normal n, projection of v onto plane:
    // proj_plane(v) = v - proj_n(v) = v - (v·n)n
    // Where:
    //   v = vector to project (moveDir)
    //   n = plane normal (gravityDir)
    //   · = dot product
    //   proj_n(v) = (v·n)n = component of v along n
    const dotProduct = moveDir.dot(gameState.gravityDir); // v·n
    const projection = moveDir.clone().addScaledVector(gameState.gravityDir, -dotProduct); // v - (v·n)n
    projection.normalize(); // Ensure unit vector: |projection| = 1
    
    // Apply movement force
    const baseSpeed = moveState.sprint ? 30 : 15; // units per second
    // Air control = 40% of ground control
    const controlFactor = gameState.canJump ? 1.0 : AIR_CONTROL_FACTOR;
    const moveSpeed = baseSpeed * controlFactor * delta; // units per frame
    
    // Apply damping to velocity (friction/air resistance)
    // v_new = v_old * dampingFactor
    // dampingFactor < 1 causes velocity to decay
    const dampingFactor = 0.9;
    gameState.velocity.multiplyScalar(dampingFactor);
    
    // Add movement velocity
    // v_new = v_old + moveDir * moveSpeed
    gameState.velocity.add(projection.multiplyScalar(moveSpeed));
    
    // Jump: apply impulse opposite to gravity
    if (moveState.jump && gameState.canJump) {
        // Jump impulse = -gravityDir * jumpStrength
        // Negative gravity = upward (opposite to downward gravity)
        const jumpStrength = 10; // units per second
        const jumpImpulse = gameState.gravityDir.clone().multiplyScalar(-jumpStrength);
        gameState.velocity.add(jumpImpulse); // v_new = v_old + jumpImpulse
        gameState.canJump = false; // Can only jump once until landing
    }
}

// Update visual effects (loot rotation, etc.)
function updateVisuals() {
    // Rotate loot items
    world.lootItems.forEach(loot => {
        loot.rotation.y += loot.userData.rotationSpeed;
        loot.rotation.x += loot.userData.rotationSpeed * 0.5;
        // Floating animation
        loot.position.y += Math.sin(Date.now() * 0.001 + loot.userData.rotation) * 0.015;
    });
}

// Update HUD
function updateHUD() {
    document.getElementById('health').textContent = `Health: ${Math.floor(gameState.health)}`;
    
    // Display gravity direction
    const gravityLabel = `Gravity: [${gameState.gravityDir.x.toFixed(1)}, ${gameState.gravityDir.y.toFixed(1)}, ${gameState.gravityDir.z.toFixed(1)}]`;
    document.getElementById('gravity').textContent = gravityLabel;
    
    // Check game over
    if (gameState.health <= 0) {
        // Reset for clean respawn
        gameState.health = 100;
        camera.position.set(0, -ROOM_SIZE / 2 + PLAYER_HEIGHT, 0);
        gameState.velocity.set(0, 0, 0);
        cameraShake.intensity = 2.0;
    }
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
        case 'KeyQ':
            // Rotate gravity 90° left around camera forward
            rotateGravityLeft();
            break;
        case 'KeyE':
            // Rotate gravity 90° right around camera forward
            rotateGravityRight();
            break;
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
