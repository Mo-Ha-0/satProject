import * as THREE from "three";
import SatelliteSimulation from "./simulation";

export default class PhysicsEngine {
  simulation: SatelliteSimulation;

  // Store state for each satellite
  satellites: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    mass: number;

    /* Drag force properties */
    dragCoefficient?: number;
    area?: number;
    initialDensity?: number;
    densityScaleHeight?: number;
    airEnabled?: boolean;
    timeScale?: number;
  }[] = [];

  // Cache for atmospheric density calculation
  private atmosphericDensityCache = new Map<number, number>();

  constructor(simulation: SatelliteSimulation) {
    this.simulation = simulation;
    this.satellites = [];
    this.reset();
  }

  /**
   * Calculate atmospheric density at given altitude
   * @param altitude Altitude above Earth surface in meters
   * @returns Atmospheric density in kg/m³
   */
  public calculateAtmosphericDensity(altitude: number): number {
    // Round altitude to nearest 100m for caching
    const cacheKey = Math.round(altitude / 100) * 100;

    if (this.atmosphericDensityCache.has(cacheKey)) {
      return this.atmosphericDensityCache.get(cacheKey)!;
    }

    const h = Math.max(0, altitude);
    let rho = 0;

    // Enhanced atmospheric density model based on US Standard Atmosphere
    if (h >= 1000000) {
      // Beyond 1000 km — essentially no atmosphere
      rho = 0;
    } else if (h < 11000) {
      // Troposphere (0-11km)
      rho = 1.225 * Math.pow(1 - (0.0065 * h) / 288.15, 4.256);
    } else if (h < 20000) {
      // Lower stratosphere (11-20km)
      rho = 0.3639 * Math.exp(-(h - 11000) / 6341.6);
    } else if (h < 32000) {
      // Upper stratosphere (20-32km)
      rho = 0.088 * Math.exp(-(h - 20000) / 7360.0);
    } else if (h < 47000) {
      // Lower mesosphere (32-47km)
      rho = 0.0132 * Math.exp(-(h - 32000) / 8000.0);
    } else if (h < 51000) {
      // Upper mesosphere (47-51km)
      rho = 0.00143 * Math.exp(-(h - 47000) / 7500.0);
    } else if (h < 71000) {
      // Lower thermosphere (51-71km)
      rho = 0.000086 * Math.exp(-(h - 51000) / 10000.0);
    } else if (h < 100000) {
      // Upper thermosphere (71-100km)
      rho = 0.0000032 * Math.exp(-(h - 71000) / 15000.0);
    } else if (h < 200000) {
      // Low Earth Orbit (100-200km)
      // Thermosphere baseline — tuned for realistic densities (~1e-10 to 1e-11 kg/m³ around 150–200 km)
      rho = 1e-9 * Math.exp(-(h - 100000) / 25000.0);
    } else if (h < 500000) {
      // Medium Earth Orbit (200-500km)
      // 200–500 km: densities ~1e-12 to 1e-13 kg/m³
      rho = 1e-11 * Math.exp(-(h - 200000) / 100000.0);
    } else if (h < 1000000) {
      // High Earth Orbit (500-1000km)
      // Above 500 km but below 1000 km: extremely thin, ~1e-14 kg/m³
      rho = 1e-13 * Math.exp(-(h - 500000) / 500000.0);
    }

    // Cache the result
    this.atmosphericDensityCache.set(cacheKey, rho);
    return rho;
  }

  addSatelliteState(options?: {
    position?: THREE.Vector3;
    velocity?: THREE.Vector3;
    mass?: number;
    dragCoefficient?: number;
    area?: number;
    initialDensity?: number;
    densityScaleHeight?: number;
    airEnabled?: boolean;
    timeScale?: number;
  }) {
    // Default values
    const height =
      options?.position?.length() || this.simulation.EARTH_RADIUS + 400000;
    const position = options?.position || new THREE.Vector3(height, 0, 0);
    const velocity = options?.velocity || new THREE.Vector3(0, 7800, 0);
    const mass = options?.mass || 1000;

    // Drag force defaults
    const dragCoefficient = options?.dragCoefficient ?? 2.2;
    const area = options?.area ?? 4;
    const initialDensity = options?.initialDensity ?? 1.225;
    const densityScaleHeight = options?.densityScaleHeight ?? 8500;
    const airEnabled = options?.airEnabled ?? true;
    const timeScale = options?.timeScale ?? 1;

    this.satellites.push({
      position: position.clone(),
      velocity: velocity.clone(),
      mass,
      dragCoefficient,
      area,
      initialDensity,
      densityScaleHeight,
      airEnabled,
      timeScale,
    });
  }

  reset() {
    this.satellites = [];
    // Reset all satellites (should be called before re-adding them)
    // The SceneSetup will re-add satellites and trails
    this.simulation.sceneSetup.satellites = [];
    this.simulation.sceneSetup.trails = [];
    this.simulation.sceneSetup.trailLines = [];
  }

  updatePhysics(deltaTime: number) {
    // Simple, fast physics like the original - just for the first satellite
    if (this.satellites.length === 0) return;
    
    const sat = this.satellites[0]; // Focus on first satellite for performance
    
    // Direct time scale application like the original
    const dt = deltaTime * this.simulation.timeScale;
    
    // Skip complex substep calculations for speed
    const distance = sat.position.length();
    
    // Simple crash check
    if (distance <= this.simulation.EARTH_RADIUS + 50000) { // 50km crash threshold
      const statusElement = document.getElementById("status");
      if (statusElement) {
        statusElement.textContent = "Crashed!";
      }
      return;
    }
    
    // Calculate gravitational force (simplified)
    const forceMagnitude = (this.simulation.G * this.simulation.EARTH_MASS * sat.mass) / (distance * distance);
    const forceDirection = sat.position.clone().normalize().multiplyScalar(-1);
    const gravityForce = forceDirection.multiplyScalar(forceMagnitude);
    
    // Simple atmospheric drag force
    let dragForce = new THREE.Vector3(0, 0, 0);
    const altitude = distance - this.simulation.EARTH_RADIUS;
    
    if (altitude < 500000 && sat.velocity.length() > 1) { // Below 500km and moving
      // Simple exponential atmosphere model - much faster than complex calculations
      const atmosphereDensity = 1.225 * Math.exp(-altitude / 8500); // kg/m³
      
      const velocity = sat.velocity.length();
      const dragCoeff = sat.dragCoefficient ?? 2.2;
      const area = sat.area ?? 4;
      
      // Drag force magnitude: F = 0.5 * ρ * v² * Cd * A
      const dragMagnitude = 0.5 * atmosphereDensity * velocity * velocity * dragCoeff * area;
      
      // Drag direction opposite to velocity
      const velocityDirection = sat.velocity.clone().normalize();
      dragForce = velocityDirection.multiplyScalar(-dragMagnitude);
    }
    
    // Combine forces
    const totalForce = gravityForce.add(dragForce);
    
    // Calculate acceleration (F = ma, so a = F/m)
    const acceleration = totalForce.divideScalar(sat.mass);
    
    // Simple Euler integration - fast like original
    sat.velocity.add(acceleration.multiplyScalar(dt));
    sat.position.add(sat.velocity.clone().multiplyScalar(dt));
    
    // Update trail (simplified)
    if (!this.simulation.sceneSetup.trails[0]) {
      this.simulation.sceneSetup.trails[0] = [];
    }
    
    const trail = this.simulation.sceneSetup.trails[0];
    if (trail.length === 0 || sat.position.distanceTo(trail[trail.length - 1]) > 1000) {
      trail.push(sat.position.clone());
      if (trail.length > this.simulation.sceneSetup.maxTrailLength) {
        trail.shift();
      }
    }
    
    // Update satellite visual position
    if (this.simulation.sceneSetup.satellites[0]) {
      this.simulation.sceneSetup.satellites[0].position.copy(
        sat.position.clone().multiplyScalar(this.simulation.SCALE_FACTOR)
      );
    }
    
    // Update status
    const escapeVelocity = Math.sqrt((2 * this.simulation.G * this.simulation.EARTH_MASS) / distance);
    const currentSpeed = sat.velocity.length();
    const statusElement = document.getElementById("status");
    if (statusElement) {
      if (currentSpeed > escapeVelocity) {
        statusElement.textContent = "Escaping!";
      } else {
        statusElement.textContent = "Orbiting";
      }
    }
    
    // Update trails and info
    this.simulation.sceneSetup.updateTrails();
    this.updateInfo();
  }

  updateInfo() {
    if (this.satellites.length === 0) return;
    
    const sat = this.satellites[0];
    const distance = sat.position.length();
    const altitude = (distance - this.simulation.EARTH_RADIUS) / 1000; // km
    const speed = sat.velocity.length(); // m/s
    const distanceFromEarth = distance / 1000; // km

    // Update basic info
    const altitudeElement = document.getElementById("currentAltitude");
    if (altitudeElement) {
      altitudeElement.textContent = `${altitude.toFixed(1)} km`;
    }

    const speedElement = document.getElementById("currentSpeed");
    if (speedElement) {
      speedElement.textContent = `${speed.toFixed(0)} m/s`;
    }

    const distanceElement = document.getElementById("currentDistance");
    if (distanceElement) {
      distanceElement.textContent = `${distanceFromEarth.toFixed(1)} km`;
    }
    
    // Update drag info
    const dragCoeffElement = document.getElementById("currentDragCoeff");
    if (dragCoeffElement) {
      dragCoeffElement.textContent = `${sat.dragCoefficient ?? 2.2}`;
    }

    const areaElement = document.getElementById("currentArea");
    if (areaElement) {
      areaElement.textContent = `${sat.area ?? 4}m²`;
    }

    const airEnabledElement = document.getElementById("currentAirEnabled");
    if (airEnabledElement) {
      airEnabledElement.textContent = altitude * 1000 < 500000 ? "Enabled" : "Disabled";
    }

    // Calculate and show atmospheric density
    const densityElement = document.getElementById("currentDensity");
    if (densityElement) {
      const atmosphereDensity = altitude * 1000 < 500000 ? 
        1.225 * Math.exp(-(altitude * 1000) / 8500) : 0;
      densityElement.textContent = `${atmosphereDensity.toExponential(3)}kg/m³`;
    }

    // Calculate and show drag force
    const dragForceElement = document.getElementById("currentDragForce");
    if (dragForceElement) {
      if (altitude * 1000 < 500000 && speed > 1) {
        const atmosphereDensity = 1.225 * Math.exp(-(altitude * 1000) / 8500);
        const dragCoeff = sat.dragCoefficient ?? 2.2;
        const area = sat.area ?? 4;
        const dragMagnitude = 0.5 * atmosphereDensity * speed * speed * dragCoeff * area;
        
        if (dragMagnitude > 0.001) {
          dragForceElement.textContent = `${(dragMagnitude/1000).toFixed(3)}kN`;
        } else {
          dragForceElement.textContent = `${dragMagnitude.toExponential(2)}N`;
        }
      } else {
        dragForceElement.textContent = "0 N";
      }
    }
  }
}
