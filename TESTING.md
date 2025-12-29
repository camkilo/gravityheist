# Testing Gravity Heist

## Quick Start

1. **Open the game**: Simply open `index.html` in a modern web browser
2. **Requirements**: Internet connection (for Three.js CDN) and WebGL support
3. **Click "START HEIST"** to begin playing

## What to Test

### 1. Procedural Generation
- Each level should have unique platform layouts
- Platforms should float in a spiral pattern with surreal rotations
- Verify 16 platforms are generated per level

### 2. Gravity Zones (Cyan, Red, Magenta areas)
- **LOW gravity (cyan)**: Jump higher and fall slower
- **HIGH gravity (red)**: Fall faster, harder to jump
- **REVERSE gravity (magenta)**: Float upward
- Check HUD displays current gravity state

### 3. Time Zones (Green torus shapes)
- Entering a zone should slow down time
- Check HUD displays "Time: SLOW"
- AI guards should also slow down

### 4. AI Security (Red figures)
- Guards should patrol in square patterns
- Vision cones (red transparent cones) detect player
- When detected, guards glow brighter and chase player
- Getting caught damages health (check HUD)

### 5. Loot Collection (Yellow octahedrons)
- Walk near loot to collect it (within 2 units)
- Yellow particle burst on collection
- HUD shows loot count increasing
- Camera shakes on collection

### 6. Physics
- **Movement**: WASD keys, Shift to sprint
- **Jump**: Space bar (only works when on platform)
- **Gravity**: Should pull player down
- **Falling**: Fall off edge triggers respawn at origin
- **Collision**: Player should land on platforms

### 7. Camera Effects
- Camera shake when collecting loot
- Camera shake when taking damage
- Smooth first-person look controls

### 8. Level Progression
- Collect all loot (10 items on level 1)
- "LEVEL COMPLETE" overlay appears
- Press Enter to go to next level
- Next level requires more loot (12 items, 14 items, etc.)
- Level number increases in HUD

### 9. Visual Effects
- Particle systems around gravity zones
- Glowing emissive materials on loot
- Fog effect in distance
- Dynamic lighting and shadows

## Known Limitations

- Game requires internet connection for Three.js CDN
- Pointer lock is required (click to activate)
- Performance depends on GPU capabilities
- No save/load functionality

## Browser Compatibility

Tested with:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+ (with experimental features enabled)

## Troubleshooting

**Issue**: Black screen after clicking "START HEIST"
- **Solution**: Check browser console for errors, ensure internet connection

**Issue**: Controls not responding
- **Solution**: Click on the game window to re-activate pointer lock

**Issue**: Performance issues
- **Solution**: Close other tabs, ensure hardware acceleration is enabled

**Issue**: Can't jump
- **Solution**: Ensure you're standing on a platform (check if falling)

## Debug Info

The HUD (top-left) shows:
- Current level number
- Loot collected vs required
- Health (100 = full, 0 = respawn)
- Current gravity state
- Current time state

