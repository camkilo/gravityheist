# Testing GRAVITY HEIST: BLACK VAULTS

## Quick Start

1. **Open the game**: Run `npm start` or `node server.js`
2. **Navigate**: Open http://localhost:3000 in your browser
3. **Click "BEGIN THE HEIST"** to start playing
4. **Requirements**: Internet connection for Three.js CDN and WebGL support

## What to Test

### 1. Directional Gravity Engine
- Press Q to rotate gravity counter-clockwise
- Press E to rotate gravity clockwise
- Gravity should change from down, to sideways, to up, etc.
- Jump direction should follow gravity direction
- Player should fall in the direction of gravity vector

### 2. Black Vaults Architecture
- Platforms should have Escher-style extreme rotations
- Some platforms should slide back and forth
- Standing on certain platforms triggers dissolve effect (transparency)
- Walls should slide up and down in cylindrical zones
- Neon wireframe edges should be visible on all platforms

### 3. Enemy Types
- **Basic Guards (Red)**: Standard patrol in square patterns
- **Sentinel Wardens (Purple)**: Create gravity fields when near player
- **Echo Guards (Cyan/Translucent)**: Follow player's path from 60 frames ago
- **Void Architects (Black with Pink)**: Spawn temporary platforms every 5 seconds
- All guards should have vision cones and chase when detected

### 4. Physics-Based Loot
- Loot items vary in size (0.3 to 0.7 units)
- Larger loot items trigger more intense camera shake
- Heavy loot (mass > 20) damages structural integrity
- Heavy loot triggers orange destruction particles
- Loot rotates on multiple axes and bobs up/down

### 5. Time Fracture Zones
- **Slow (Green torus)**: Everything moves at 30% speed
- **Freeze (Blue torus)**: Nearly frozen at 5% speed
- **Rewind (Pink torus)**: Negative time at -50% speed
- **Shatter (Yellow torus)**: Fast-forward at 200% speed
- Zones should pulse and change opacity

### 6. Cinematic Visual Effects
- Volumetric exponential fog
- Multiple colored point lights (cyan, magenta, yellow)
- Metallic PBR materials with high emissive intensity
- Camera shake increases with low structural integrity
- ACES filmic tone mapping for cinematic look

## Advanced Testing

### Structural Integrity System
- Collect multiple heavy loot items in sequence
- Watch structural integrity drop below 50
- Camera shake should increase dramatically
- When integrity reaches 0, player should respawn

### Dynamic Elements
- Observe walls sliding up and down
- Stand on dissolving platforms - they should fade
- Void Architect spawns should appear as pink platforms
- Temporary platforms fade after 10 seconds

### Gravity Field Interactions
- Walk near a purple Sentinel Warden
- Gravity direction should be influenced toward the guard
- Effect should blend with zone gravity

### Echo Guard Behavior
- Move in a complex pattern for 60 frames (4 seconds)
- Observe cyan Echo Guard following your exact path
- Guard appears where you were 4 seconds ago

## Performance Testing

- Check FPS remains stable (should be 60fps on modern hardware)
- Test with 10+ loot collection particles active
- Verify shadow rendering doesn't cause lag
- Check particle systems update smoothly

## Browser Compatibility

Tested with:
- Chrome 90+ ✓
- Firefox 88+ ✓
- Edge 90+ ✓
- Safari 14+ (requires experimental features)

## Known Limitations

- Requires internet connection for Three.js CDN
- Pointer lock required for first-person controls
- Performance depends on GPU capabilities
- No save/load functionality yet
- Mobile browsers not fully supported

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

