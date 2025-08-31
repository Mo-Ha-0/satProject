import * as THREE from "three";
import SatelliteSimulation from "./simulation";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EnhancedEffects } from "./enhanced-effects";

export default class SceneSetup {
  simulation: SatelliteSimulation;

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  // earth: THREE.Mesh;
  // satellite: THREE.Mesh;
  // trailLine: THREE.Line;

  earth: THREE.Group;
  textureLoader: THREE.TextureLoader;

  satellites: THREE.Group[] = [];
  trails: THREE.Vector3[][] = [];
  trailLines: THREE.Line[] = [];
  maxTrailLength: number = 1000;
  sunLight!: THREE.DirectionalLight;
  nightLight!: THREE.AmbientLight;

  constructor(simulation: SatelliteSimulation) {
    this.simulation = simulation;

    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000011, 1);
    document.getElementById("container")?.appendChild(this.renderer.domElement);

    // Create Earth (always use procedural sphere)
    this.earth = this.createEarth();
    this.scene.add(this.earth);
    this.textureLoader = new THREE.TextureLoader();

    // Remove default satellites. Do not add any satellites in the constructor.
    // Satellites will be added via the UI only.

    // Add stars in the background
    this.addStars(2000);

    // Add lighting
    this.addLighting();

    // Add enhanced visual effects
    const enhancedEffects = new EnhancedEffects(this.renderer, this.scene, this.camera);
    enhancedEffects.enhanceRenderer();
    enhancedEffects.addAtmosphericFog();
    enhancedEffects.createLensFlare();

    // Camera position
    this.camera.position.set(0, 0, 800);
    this.camera.lookAt(0, 0, 0);
  }

  async addSatellite(options?: { position?: THREE.Vector3; velocity?: THREE.Vector3; mass?: number; dragCoefficient?: number; area?: number }) {
    // Create satellite group
    const satellite = new THREE.Group();
    try {
      const loader = new GLTFLoader();
      const satData = await loader.loadAsync(
        "./assets/models/Satellite/Satellite.gltf"
      );
      const satModel = satData.scene;
      satModel.scale.set(0.01, 0.01, 0.01);
      satellite.add(satModel);
    } catch (error) {
      // Fallback to primitive
      const fallback = this.createSatellite();
      satellite.add(fallback);
    }
    this.scene.add(satellite);
    this.satellites.push(satellite);
    // Create trail for this satellite
    const trail: THREE.Vector3[] = [];
    this.trails.push(trail);
    // Create trail line
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.8,
    });
    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    this.scene.add(trailLine);
    this.trailLines.push(trailLine);
    // Register initial state in physics engine
    this.simulation.physicsEngine.addSatelliteState(options);

    // Update the satellite list in the UI
    if (this.simulation.controlsManager) {
      this.simulation.controlsManager.updateSatelliteList();
    }
  }

  createEarth(): THREE.Group {
    const group = new THREE.Group();
    const earthGeometry = new THREE.SphereGeometry(
      this.simulation.EARTH_RADIUS * this.simulation.SCALE_FACTOR,
      128, // Increased resolution for better detail
      128
    );

    // Load Earth textures with error handling
    const textureLoader = new THREE.TextureLoader();
    
    // Helper function to load texture with fallback
    const loadTextureWithFallback = (path: string, fallbackColor: number = 0x4444ff) => {
      return new Promise<THREE.Texture>((resolve) => {
        textureLoader.load(
          path,
          (texture) => resolve(texture),
          undefined,
          (error) => {
            console.warn(`Failed to load texture: ${path}`, error);
            // Create a fallback colored texture
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = `#${fallbackColor.toString(16).padStart(6, '0')}`;
            ctx.fillRect(0, 0, 512, 512);
            const fallbackTexture = new THREE.CanvasTexture(canvas);
            resolve(fallbackTexture);
          }
        );
      });
    };

    // Load all textures with fallbacks
    Promise.all([
      loadTextureWithFallback("./assets/models/earth/textures/earth albedo.jpg", 0x4444ff),
      loadTextureWithFallback("./assets/models/earth/textures/earth bump.jpg", 0x444444),
      loadTextureWithFallback("./assets/models/earth/textures/earth night_lights_modified.png", 0x000000),
      loadTextureWithFallback("./assets/models/earth/textures/clouds earth.png", 0xffffff),
      loadTextureWithFallback("./assets/models/earth/textures/earth land ocean mask.png", 0x444444)
    ]).then(([albedoTexture, bumpTexture, nightLightsTexture, cloudsTexture, landOceanMask]) => {
      // Create enhanced Earth material
      const earthMaterial = new THREE.MeshPhongMaterial({
        map: albedoTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.1, // Increased bump intensity
        shininess: 25,
        specular: 0x333333,
        emissive: 0x000000,
        emissiveMap: nightLightsTexture,
        emissiveIntensity: 0.3, // Night lights intensity
        transparent: true,
        opacity: 1.0,
      });

      const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
      group.add(earthMesh);

      // Add cloud layer for atmosphere
      const cloudGeometry = new THREE.SphereGeometry(
        (this.simulation.EARTH_RADIUS * this.simulation.SCALE_FACTOR) + 2, // Slightly larger than Earth
        128,
        128
      );

      const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4, // Semi-transparent clouds
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
      group.add(cloudMesh);

      // Add atmospheric glow effect
      const atmosphereGeometry = new THREE.SphereGeometry(
        (this.simulation.EARTH_RADIUS * this.simulation.SCALE_FACTOR) + 8,
      64,
      64
    );

      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x87CEEB, // Sky blue
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });

      const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      group.add(atmosphereMesh);

      // Add specular highlights for ocean reflection
      const oceanSpecularMaterial = new THREE.MeshPhongMaterial({
        color: 0x006994, // Ocean blue
        transparent: true,
        opacity: 0.3,
        shininess: 100,
        specular: 0x444444,
        side: THREE.FrontSide,
      });

      const oceanMesh = new THREE.Mesh(earthGeometry, oceanSpecularMaterial);
      oceanMesh.material = oceanSpecularMaterial;
      group.add(oceanMesh);

      // Animate clouds rotation
      const animateClouds = () => {
        cloudMesh.rotation.y += 0.0005; // Slow cloud rotation
        requestAnimationFrame(animateClouds);
      };
      animateClouds();

      // Add subtle Earth glow effect
      const glowGeometry = new THREE.SphereGeometry(
        (this.simulation.EARTH_RADIUS * this.simulation.SCALE_FACTOR) + 1,
        64,
        64
      );

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });

      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glowMesh);

    }).catch((error) => {
      console.error("Error loading Earth textures:", error);
      // Fallback to basic material with enhanced colors
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x4A90E2, // Better blue color
        shininess: 30,
        specular: 0x222222,
      });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    group.add(earthMesh);
    });

    return group;
  }

  createSatellite(): THREE.Group {
    const group = new THREE.Group();
    const satGeometry = new THREE.SphereGeometry(5, 32, 32); // Higher resolution
    const satMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b35,
      emissive: 0x222222,
      shininess: 80, // More reflective
      specular: 0x444444,
    });

    const body = new THREE.Mesh(satGeometry, satMaterial);
    group.add(body);

    // Solar panels with enhanced materials
    const panelGeometry = new THREE.BoxGeometry(20, 5, 1);
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a, // Darker, more realistic
      emissive: 0x111111,
      shininess: 100, // Very reflective like solar panels
      specular: 0x666666,
    });

    const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel1.position.set(15, 0, 0);
    group.add(panel1);

    const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel2.position.set(-15, 0, 0);
    group.add(panel2);

    return group;
  }

  addStars(count: number) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.0, // Slightly larger stars
      transparent: true,
      sizeAttenuation: true,
    });

    const vertices = [];
    for (let i = 0; i < count; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      vertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(starField);
  }

  addLighting() {
    // Enhanced ambient lighting for better overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Create directional light for the sun with enhanced properties
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(100, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.scene.add(this.sunLight);

    // Add a second light for night side illumination with warmer tone
    this.nightLight = new THREE.AmbientLight(0x1a1a3a, 0.3);
    this.scene.add(this.nightLight);

    // Add a subtle blue fill light for atmospheric effect
    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.2);
    fillLight.position.set(-50, -30, -20);
    this.scene.add(fillLight);

    // Add a rim light for better edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 0, -100);
    this.scene.add(rimLight);
  }

  updateTrails() {
    for (let i = 0; i < this.trails.length; i++) {
      const trail = this.trails[i];
      if (trail.length > 1) {
        const points = trail.map((pos) =>
          pos.clone().multiplyScalar(this.simulation.SCALE_FACTOR)
        );
        const trailGeometry = new THREE.BufferGeometry();
        trailGeometry.setFromPoints(points);
        this.trailLines[i].geometry = trailGeometry;
      }
    }
  }

  updateInfo() {
    // Show info for the first satellite (or extend for all)
    if (this.simulation.physicsEngine.satellites.length > 0) {
      const sat = this.simulation.physicsEngine.satellites[0];
      const distance = sat.position.length();
      const altitude = (distance - this.simulation.EARTH_RADIUS) / 1000; // km
      const speed = sat.velocity.length(); // m/s
      const distanceFromEarth = distance / 1000; // km

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

      // Add drag force information
      const dragCoeffElement = document.getElementById("currentDragCoeff");
      if (dragCoeffElement) {
        dragCoeffElement.textContent = `${sat.dragCoefficient ?? 2.2}`;
      }

      const areaElement = document.getElementById("currentArea");
      if (areaElement) {
        areaElement.textContent = `${sat.area ?? 4} m²`;
      }

      const airEnabledElement = document.getElementById("currentAirEnabled");
      if (airEnabledElement) {
        airEnabledElement.textContent = sat.airEnabled ? "Enabled" : "Disabled";
      }

      // Calculate and display current atmospheric density using physics engine
      const densityElement = document.getElementById("currentDensity");
      if (densityElement) {
        const h = Math.max(0, altitude * 1000); // Convert back to meters
        const rho = this.simulation.physicsEngine.calculateAtmosphericDensity(h);
        densityElement.textContent = `${rho.toExponential(3)} kg/m³`;
      }

      // Calculate and display current drag force using physics engine
      const dragForceElement = document.getElementById("currentDragForce");
      if (dragForceElement && sat.airEnabled) {
        const h = Math.max(0, altitude * 1000);
        const rho = this.simulation.physicsEngine.calculateAtmosphericDensity(h);
        
        // Force drag force to 0 if density is 0 (very high altitudes)
        if (rho === 0) {
          dragForceElement.textContent = "0 N";
        } else {
          const Cd = sat.dragCoefficient ?? 2.2;
          const A = sat.area ?? 4;
          const dragMagnitude = 0.5 * rho * speed * speed * Cd * A;
          
          if (dragMagnitude > 0.001) { // Only show if drag is significant
            dragForceElement.textContent = `${(dragMagnitude/1000).toFixed(3)} N`;
          } else {
            dragForceElement.textContent = `${(dragMagnitude).toExponential(2)} N`;
          }
        }
      } else if (dragForceElement) {
        dragForceElement.textContent = "0 N";
      }
    }
    
    // Update time scale display
    const timeScaleElement = document.getElementById("currentTimeScale");
    if (timeScaleElement) {
      timeScaleElement.textContent = `${this.simulation.timeScale.toFixed(1)}x`;
    }
  }
}
