# GRAVITY HEIST: BLACK VAULTS

**Genre:** Cinematic 3D Action / Heist / Physics-Driven Roguelike  
**Hook:** Every level breaks the laws of reality differently.

You're not a hero. You're a reality burglar.

A cinematic 3D heist game set in impossible megastructures with rotating gravity, physics-driven destruction, adaptive enemy AI, and time-fracture zones. Navigate the Black Vaults - impossible structures floating in fractured space where rooms assemble in real time, walls slide, gravity flips, and floors dissolve into void.

## Core Systems

### 1. Directional Gravity Engine
- **Gravity as a Vector**: Not just magnitude - gravity has direction and can be rotated
- **Mid-Run Rotation**: Press Q/E to rotate gravity direction while playing
- **Floors Become Walls**: Dynamic gravity allows walking on any surface
- **Physics Objects**: Enemies and debris obey the same gravity physics

### 2. Black Vaults World Design
- **Impossible Megastructures**: Escher-style architecture floating in fractured space
- **Dynamic Rooms**: Walls slide, floors dissolve, platforms move in real-time
- **No Fixed Up/Down**: World rotates dynamically based on gravity direction
- **Structural Integrity**: Heavy actions can collapse the environment itself

### 3. Cinematic Heist AI
- **Sentinel Wardens**: Rewrite gravity locally, pulling you toward them
- **Echo Guards**: Repeat your last move pattern, appearing where you were
- **Void Architects**: Actively rebuild rooms to trap you
- **Predictive Behavior**: AI predicts your movement, not just your position
- **Security Escalation**: Alert levels trigger cinematic lockdown sequences

### 4. Physics-Loot Mayhem
- **Mass & Momentum**: Each loot item has physical properties
- **Destruction Values**: Heavy loot can rip floors apart when collected
- **Structural Failure**: Collecting certain relics triggers environment collapse
- **Dynamic Impact**: Loot collection creates particle explosions and camera shake

### 5. Time Fracture Events
- **Slow Zones**: Time moves at 30% speed
- **Freeze Zones**: Nearly stop time at 5% speed
- **Rewind Zones**: Time flows backward (-50% speed)
- **Shatter Zones**: Time moves at 2x speed
- **Pulsing Effects**: Time zones visually pulse and affect all entities

### 6. Cinematic Visual Direction
- **Volumetric Fog**: Exponential fog for depth and atmosphere
- **God Rays**: Multiple colored point lights (cyan, magenta, yellow)
- **Neon Edges**: All platforms outlined with glowing wireframes
- **Metallic Surfaces**: PBR materials with high metalness and low roughness
- **Camera Shake**: Dynamic shake based on structural integrity
- **Tone Mapping**: ACES Filmic tone mapping for cinematic look

## How to Play

### Start the Game
1. Open the game in a modern web browser (requires internet for Three.js CDN)
2. Click "BEGIN THE HEIST" to start
3. Click anywhere to activate pointer lock controls

### Controls
- **WASD**: Move forward/backward/left/right
- **Mouse**: Look around (pointer lock)
- **Space**: Jump (direction based on current gravity)
- **Shift**: Sprint
- **Q**: Rotate gravity counter-clockwise
- **E**: Rotate gravity clockwise
- **R**: Use special ability (reserved for future features)
- **Enter**: Proceed to next level when complete
- **ESC**: Release pointer lock

### Objective
- **Collect Loot**: Gather all required loot items (yellow octahedrons) 
- **Avoid Detection**: Evade AI guards (red = basic, purple = sentinel, cyan = echo, black = void)
- **Navigate Zones**: Use gravity and time zones strategically
- **Survive**: Watch your health and structural integrity
- **Progress**: Complete levels to unlock harder challenges

## Gameplay Systems

### Enemy Types
1. **Basic Guards (Red)**: Standard patrol and chase behavior
2. **Sentinel Wardens (Purple)**: Create localized gravity fields that pull you toward them
3. **Echo Guards (Cyan/Translucent)**: Replay your movement from 60 frames ago
4. **Void Architects (Black/Pink)**: Spawn temporary platforms every 5 seconds to trap you

### Environmental Hazards
- **Sliding Walls**: Massive walls that move up and down
- **Dissolving Floors**: Platforms that fade when you stand on them
- **Structural Collapse**: Heavy loot collection damages the environment
- **Void Falls**: Falling off the world deals damage and respawns you

### Zone Types
**Gravity Zones (Cylindrical)**
- Low (Cyan): 30% gravity
- High (Red): 200% gravity  
- Reverse (Magenta): Upward gravity
- Sideways (Green): Diagonal gravity
- Custom: Various directional forces

**Time Fracture Zones (Torus)**
- Slow (Green): 30% time speed
- Freeze (Blue): 5% time speed
- Rewind (Pink): -50% time (backward)
- Shatter (Yellow): 200% time speed

## Technical Details

### Technologies
- **Three.js 0.160.0**: 3D rendering and scene management
- **JavaScript ES6 Modules**: Modern code organization
- **WebGL**: Hardware-accelerated graphics with PBR materials
- **Pointer Lock API**: Immersive first-person controls
- **Node.js Server**: Express-less static file server for deployment

### Architecture
- **Directional Physics**: Vector-based gravity system with 3D velocity
- **Procedural Generation**: Seeded randomness for reproducible levels
- **Object-Oriented Design**: ProceduralWorld class manages all game objects
- **AI State Machines**: Multiple behavior types with prediction
- **Particle Systems**: Dynamic particle effects for zones and impacts
- **Material System**: PBR materials with metalness and emissive properties

### Performance
- Optimized shadow mapping (2048x2048)
- Particle pooling for collection effects
- Efficient collision detection with radius checks
- Hardware-accelerated rendering with tone mapping

### Browser Requirements
- Modern browser with WebGL 2.0 support
- Pointer lock capability
- ES6 module support (Import Maps)
- Recommended: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

## Deployment

### Quick Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/camkilo/gravityheist)

1. Click the "Deploy" button above
2. Connect your GitHub account
3. Deploy - automatically configured!

**Features:**
- Automatic SSL/HTTPS
- Global CDN with edge caching
- Zero-config deployment
- Custom domain support

### Deploy to Render

1. Fork this repository
2. Create a new Web Service on [Render](https://render.com)
3. Connect your forked repository
4. Render will auto-detect `render.yaml`
5. Deploy!

**Features:**
- Free tier available
- Automatic SSL/HTTPS
- Simple Node.js server setup
- Environment variable support

### Local Development

**Using Node.js (Recommended):**
```bash
npm start
# or
node server.js
```

Then open http://localhost:3000 in your browser.

**Alternative: Python:**
```bash
python3 -m http.server 8080
```

**Alternative: PHP:**
```bash
php -S localhost:8080
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development)

### Files
- `index.html`: Main game page with UI and styling
- `game.js`: Core game logic with all Black Vaults features
- `server.js`: Production-ready Node.js static file server
- `render.yaml`: Render deployment configuration
- `vercel.json`: Vercel deployment configuration with CORS headers
- `package.json`: Node.js dependencies and scripts

## Gameplay Tips

1. **Master Gravity Rotation**: Use Q/E to rotate gravity and reach impossible areas
2. **Heavy Loot Strategy**: Collect heavy loot last - it damages structures
3. **Zone Combinations**: Combine low gravity + slow time for maximum control
4. **Enemy Patterns**: 
   - Sentinels create gravity wells - stay away
   - Echo Guards follow your path - change direction frequently
   - Void Architects spawn platforms - use them or avoid them
5. **Structural Integrity**: Watch the integrity meter - environment collapse is deadly
6. **Time Fractures**: Freeze zones make escaping easier; fast zones make collection harder

## Future Enhancements

- **Multiplayer Co-op**: Team up for coordinated heists
- **More Zone Types**: Teleportation, invisibility, anti-gravity bubbles
- **Weapon Systems**: Gravity guns, time manipulators, reality anchors
- **Procedural Music**: Dynamic soundtrack that responds to gameplay
- **Persistent Progress**: Save/load system with unlockables
- **Leaderboards**: Speedrun modes and challenge rankings
- **VR Support**: Full immersion in impossible architecture

## Credits

**Game Design**: Black Vaults concept inspired by Escher, Inception, and Prey (2017)  
**Technology**: Built with Three.js and modern web technologies  
**Author**: camkilo  
**License**: MIT

## Screenshots

![Black Vaults Start Screen](https://github.com/user-attachments/assets/9f753b3f-10f5-4119-a5ac-ad8a95cbd88c)

---

**Remember**: You're not a hero. You're a reality burglar. Every level breaks the laws of reality differently.
