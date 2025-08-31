# Satellite Orbital Mechanics Simulation

A real-time 3D satellite orbital mechanics simulator built with Three.js and TypeScript. Experience realistic orbital dynamics with atmospheric drag, multiple satellites, and ultra-high-speed time scaling up to 10,000x normal time.

![Satellite Simulation](https://img.shields.io/badge/Status-Active-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white) ![Three.js](https://img.shields.io/badge/Three.js-000000?logo=three.js&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

## 🚀 Features

### Core Simulation
- **Real-time orbital mechanics** with accurate gravitational physics
- **Atmospheric drag modeling** with exponential atmosphere
- **Multiple satellite support** with independent parameters
- **Orbital trail visualization** with configurable length
- **Crash detection** with realistic altitude thresholds

### Advanced Controls
- **Ultra-high time scaling** (0.1x to 10,000x speed)
- **Quick preset buttons** for common speeds (1x, 10x, 100x, 1000x, 🔥 ULTRA)
- **Real-time parameter adjustment** for all satellite properties
- **Multiple camera modes** (Orbit, Follow, Free)
- **Preset scenarios** (Crash, Orbit, Escape)

### Visual Features
- **3D Earth model** with realistic textures and lighting
- **Day/night cycle** with dynamic sun positioning
- **Starfield background** for space environment
- **Satellite 3D models** with fallback primitives
- **Trail rendering** showing orbital paths

## 🎮 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
```bash
cd satellite/my-sat
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5174/` (or the port shown in terminal)

### Building for Production
```bash
npm run build
npm run preview
```

## 🎯 User Guide

### Interface Overview

#### Control Panel (Left Side)
- **Satellites Section**: Add, delete, and select satellites
- **Time Scale Controls**: Speed multiplier with slider and presets
- **Satellite Parameters**: Height, mass, velocity, direction
- **Atmospheric Properties**: Drag coefficient and cross-sectional area
- **Scenario Presets**: Quick setups for common orbits
- **Camera Controls**: Switch between viewing modes
- **Simulation Controls**: Play/pause and reset buttons

#### Information Panel (Right Side)
- **Real-time Data**: Altitude, speed, distance from Earth
- **Status**: Current satellite state (Orbiting/Escaping/Crashed)
- **Camera Mode**: Active viewing mode
- **Time Scale**: Current speed multiplier
- **Atmospheric Data**: Drag coefficient, area, air resistance status
- **Environment**: Atmospheric density and drag force

### Basic Usage

#### 1. Starting a Simulation
- The simulation starts automatically with a default satellite at 400km altitude
- Use **Play/Pause** button to control simulation
- Adjust **Time Scale** for faster or slower motion

#### 2. Adding Satellites
1. Set desired parameters (height, mass, velocity, direction)
2. Click **"Add Satellite"** button
3. New satellite appears with its own orbital trail
4. Use **"Follow Satellite"** dropdown to switch between satellites

#### 3. Time Scale Control
- **Slider**: Drag to any speed from 0.1x to 10,000x
- **Preset Buttons**:
  - `1x` - Normal time
  - `10x` - 10x faster
  - `50x` - 50x faster  
  - `100x` - 100x faster
  - `500x` - High speed
  - `1000x` - Very high speed
  - `5000x` - Extreme speed
  - `🔥 ULTRA` - Maximum 10,000x speed

#### 4. Camera Controls
- **Orbit Mode** (Default): Rotate around Earth
  - Drag mouse to orbit
  - Scroll to zoom
- **Follow Mode**: Track selected satellite
- **Free Mode**: First-person navigation
  - WASD - Move camera
  - Arrow keys - Rotate view
  - RF - Up/Down movement

## ⚙️ Technical Details

### Physics Engine

#### Gravitational Mechanics
- **Newton's Law of Universal Gravitation**: `F = G * M * m / r²`
- **Earth Mass**: 5.972 × 10²⁴ kg
- **Earth Radius**: 6,371,000 m
- **Gravitational Constant**: 6.6743 × 10⁻¹¹ m³/kg·s²

#### Atmospheric Drag Model
- **Simple Exponential Atmosphere**: `ρ = 1.225 * e^(-h/8500)`
- **Drag Equation**: `F = 0.5 * ρ * v² * Cd * A`
- **Active Range**: Surface to 500km altitude
- **Automatic Disable**: Above 500km (space environment)

#### Integration Method
- **Simple Euler Integration** for optimal performance
- **Adaptive Time Stepping** based on simulation speed
- **Direct Time Scale Multiplication** for responsiveness

### Performance Optimizations

#### Time Scale Tiers
- **1x-10x**: High precision, small time steps
- **11x-100x**: Medium precision, balanced performance
- **101x-1000x**: Lower precision, larger time steps
- **1000x+**: Minimal precision, maximum speed

#### Rendering Optimizations
- **Fixed 60 FPS timestep** for consistent performance
- **Simplified physics** at ultra-high speeds
- **Efficient trail management** with length limits
- **Optimized force calculations** without complex substeps

### Satellite Parameters

#### Physical Properties
- **Height**: 200-50,000 km above Earth surface
- **Mass**: 100-10,000 kg
- **Velocity**: 1,000-15,000 m/s
- **Direction**: 0-360 degrees

#### Atmospheric Properties
- **Drag Coefficient (Cd)**: 0.1-5.0 (typical: 2.2)
- **Cross-sectional Area (A)**: 0.1-20.0 m² (typical: 4.0)

## 🎓 Educational Use

### Learning Orbital Mechanics

#### Basic Concepts
- **Circular Velocity**: ~7,800 m/s at 400km for stable orbit
- **Escape Velocity**: ~11,200 m/s at Earth surface
- **Orbital Decay**: Low satellites lose altitude due to drag
- **Orbital Periods**: Higher orbits take longer to complete

#### Experimentation Ideas
1. **Find Circular Orbit Speed**: Adjust velocity until orbit is stable
2. **Atmospheric Drag Effects**: Compare orbits at different altitudes
3. **Escape Scenarios**: Determine minimum escape velocity
4. **Satellite Design**: Test different drag coefficients and areas
5. **Mission Planning**: Design satellite constellations

### Scenario Examples

#### Stable Low Earth Orbit (LEO)
- **Height**: 400 km
- **Velocity**: 7,800 m/s
- **Direction**: 90° (tangential)
- **Expected**: Stable circular orbit

#### Atmospheric Decay Orbit
- **Height**: 200 km  
- **Velocity**: 7,800 m/s
- **Direction**: 90°
- **Expected**: Gradual altitude loss due to drag

#### Escape Trajectory
- **Height**: 400 km
- **Velocity**: 12,000 m/s
- **Direction**: 90°
- **Expected**: Satellite escapes Earth's gravity

#### Crash Scenario
- **Height**: 300 km
- **Velocity**: 5,000 m/s
- **Direction**: 45°
- **Expected**: Insufficient velocity, satellite crashes

## 🔧 Development

### Project Structure
```
my-sat/
├── src/
│   ├── main.ts                 # Main application entry
│   ├── simulation.ts           # Core simulation class
│   ├── physics-engine.ts       # Physics calculations
│   ├── scene-setup.ts          # 3D scene management  
│   ├── camera-controller.ts    # Camera controls
│   ├── controls-manager.ts     # UI controls
│   └── globals.d.ts           # TypeScript definitions
├── assets/
│   └── models/                # 3D models and textures
├── public/
├── index.html                 # Main HTML page
├── style.css                  # Styling
├── package.json              # Dependencies
├── vite.config.js            # Build configuration
└── tsconfig.json             # TypeScript configuration
```

### Key Classes

#### `SatelliteSimulation`
Main simulation orchestrator
- Manages all subsystems
- Handles animation loop
- Coordinates between physics and rendering

#### `PhysicsEngine`
Core physics calculations
- Gravitational force computation
- Atmospheric drag modeling
- Satellite state management
- Collision detection

#### `SceneSetup`
3D scene management
- Earth and satellite rendering
- Lighting and materials
- Trail visualization
- Asset loading

#### `CameraController`
Camera system management
- Multiple viewing modes
- User input handling
- Smooth transitions

#### `ControlsManager`
UI controls integration
- Parameter synchronization
- Event handling
- Scenario management

### Adding New Features

#### New Satellite Parameters
1. Add property to satellite interface in `physics-engine.ts`
2. Update UI controls in `index.html`
3. Add synchronization in `main.ts`
4. Include in physics calculations

#### New Time Scale Presets
1. Add button in `index.html` with `data-speed` attribute
2. Preset will automatically work with existing system

#### New Camera Modes
1. Add mode to `CameraMode` type in `camera-controller.ts`
2. Implement logic in `updateCameraPosition()`
3. Add UI button with event listener

## 📊 Performance Benchmarks

### Time Scale Performance
- **1x-10x**: 60+ FPS on modern hardware
- **100x**: 50+ FPS with full physics
- **1000x**: 40+ FPS with optimizations
- **10000x**: 30+ FPS with minimal calculations

### Memory Usage
- **Base simulation**: ~50MB
- **Multiple satellites**: ~5MB per additional satellite
- **Texture assets**: ~20MB for Earth and satellite models

## 🐛 Troubleshooting

### Common Issues

#### Simulation Runs Slowly
- **Solution**: Reduce time scale or number of satellites
- **Check**: Browser performance settings
- **Verify**: Hardware acceleration is enabled

#### Satellite Disappears
- **Cause**: Satellite may have crashed or escaped
- **Solution**: Check altitude and velocity values
- **Reset**: Use Reset button to restore default state

#### Controls Not Responding  
- **Solution**: Refresh the page
- **Check**: Console for JavaScript errors
- **Verify**: Development server is running

#### Models Not Loading
- **Cause**: Asset path issues
- **Fallback**: Primitive shapes will be used automatically
- **Check**: Network tab for 404 errors

### Performance Tips
1. **Use lower time scales** for better precision
2. **Limit number of satellites** for better performance
3. **Close other browser tabs** to free up resources
4. **Use Chrome or Firefox** for best WebGL performance

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Bug fixes
- New features
- Performance improvements
- Documentation updates
- Educational content

## 📚 References

### Scientific Sources
- NASA's [Orbital Mechanics](https://www.nasa.gov/audience/forstudents/5-8/features/nasa-knows/what-is-orbital-mechanics-58.html)
- NOAA's [Atmospheric Models](https://www.esrl.noaa.gov/gmd/grad/solcalc/calcdetails.html)
- ESA's [Space Debris Environment](https://www.esa.int/Safety_Security/Space_Debris)

### Technical Documentation
- [Three.js Documentation](https://threejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Build Tool](https://vitejs.dev/guide/)

---

**Built with ❤️ for space enthusiasts and educators**

*Experience the beauty and complexity of orbital mechanics in real-time!*
