# Gravity Heist - Interdimensional Thieves

A surreal 3D heist game where players navigate procedurally generated floating architecture, evade adaptive AI security, and collect loot across gravity-shifting zones and time-warped areas.

## Features

### Procedurally Generated Worlds
- **Floating Architecture**: Dynamically generated platforms in spiral patterns with surreal rotations
- **Gravity-Shifting Zones**: LOW, HIGH, and REVERSE gravity areas that affect player physics
- **Time-Warped Areas**: Slow-motion zones that alter game speed and AI behavior

### Adaptive AI Security
- Intelligent guard patrols with vision cone detection
- Alert level system that responds to player proximity
- Chase behavior when player is detected
- Adaptive movement speeds based on time warp zones

### Physics-Driven Interactions
- Realistic gravity simulation with zone-based modifications
- Physics-based player movement (walk, sprint, jump)
- Loot collection with physics particle effects
- Fall damage and respawn mechanics

### Visual Effects
- Particle systems for gravity zones and time zones
- Collection particle bursts when collecting loot
- Glowing emissive materials on loot and architecture
- Cinematic camera shake for impact feedback
- Dynamic fog and lighting

### Cinematic Camera
- Pointer lock first-person controls
- Camera shake effects for dramatic moments
- Smooth movement with time warp integration
- Immersive perspective for high-energy heists

### Dynamic Level Generation
- Each level is procedurally generated with unique layouts
- Increasing difficulty with more loot required per level
- Randomized platform positions, colors, and rotations
- Varied AI patrol patterns

## How to Play

1. Open `index.html` in a modern web browser
2. Click "START HEIST" to begin
3. Use pointer lock controls to look around

### Controls
- **WASD**: Move forward/backward/left/right
- **Mouse**: Look around
- **Space**: Jump
- **Shift**: Sprint
- **E**: Collect loot (automatic within range)
- **Enter**: Proceed to next level when complete

### Objective
- Collect all required loot items (yellow octahedrons) to complete each level
- Avoid AI guards (red figures with vision cones)
- Navigate gravity zones and time warps strategically
- Survive and progress through increasingly difficult dimensions

## Technical Details

### Technologies
- **Three.js**: 3D rendering and scene management
- **JavaScript ES6 Modules**: Modern code organization
- **WebGL**: Hardware-accelerated graphics
- **Pointer Lock API**: Immersive first-person controls

### Architecture
- Procedural generation with seeded randomness
- Object-oriented design with ProceduralWorld class
- Real-time AI behavior with patrol and chase states
- Physics simulation with zone-based modifiers
- Particle systems for visual effects

### Browser Requirements
- Modern browser with WebGL support
- Pointer lock capability
- ES6 module support

## Development

The game is built as a standalone HTML/JavaScript application:
- `index.html`: Main page with UI and styling
- `game.js`: Core game logic, procedural generation, and rendering

No build process required - simply open `index.html` in a browser to play.

## Gameplay Tips

1. **Gravity Zones**: Use LOW gravity zones to reach high platforms, avoid HIGH gravity areas
2. **Time Zones**: Slow motion gives you time to evade guards
3. **AI Patterns**: Learn guard patrol routes to avoid detection
4. **Strategic Collection**: Plan your route to collect loot efficiently
5. **Health Management**: Avoid guards and falling off platforms

## Future Enhancements

- Multiplayer co-op heists
- More zone types (teleportation, invisibility)
- Weapon and tool systems
- Procedural music generation
- Save/load game progress
- Leaderboards and speedrun modes
