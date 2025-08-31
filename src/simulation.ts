import * as THREE from "three";
import CameraController from "./camera-controller";
import ControlsManager from "./controls-manager";
import SceneSetup from "./scene-setup";
import PhysicsEngine from "./physics-engine";

export default class SatelliteSimulation {
  // Constants
  readonly EARTH_RADIUS: number = 6371000; // meters
  readonly EARTH_MASS: number = 5.972e24; // kg
  readonly G: number = 6.6743e-11; // gravitational constant
  readonly SCALE_FACTOR: number = 1e-5; // Scale for visualization

  // Three.js components
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  // Simulation components
  sceneSetup: SceneSetup;
  physicsEngine: PhysicsEngine;
  cameraController: CameraController;
  controlsManager: ControlsManager;

  // Simulation state
  isRunning: boolean = true;
  timeScale: number = 1;
  private lastTime: number = 0;

  constructor() {
    this.sceneSetup = new SceneSetup(this);
    this.scene = this.sceneSetup.scene;
    this.camera = this.sceneSetup.camera;
    this.renderer = this.sceneSetup.renderer;

    this.physicsEngine = new PhysicsEngine(this);
    this.cameraController = new CameraController(this);
    this.controlsManager = new ControlsManager(this);

    this.physicsEngine.reset();
    
    // Add a default satellite for immediate testing
    this.addInitialSatellite();
    
    this.sceneSetup.updateInfo();
    this.animate();
  }

  private async addInitialSatellite() {
    // Add default satellite at 400km altitude with orbital velocity
    const height = 400000; // 400km
    const position = new THREE.Vector3(this.EARTH_RADIUS + height, 0, 0);
    const velocity = new THREE.Vector3(0, 7800, 0); // ~orbital velocity
    
    await this.sceneSetup.addSatellite({
      position,
      velocity,
      mass: 1000,
      dragCoefficient: 2.2,
      area: 4
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.isRunning) {
      // Use simple fixed timestep like the original - much faster!
      this.physicsEngine.updatePhysics(0.016); // ~60 FPS equivalent (1/60 = 0.016)
    }

    this.cameraController.updateCameraPosition();

    // Rotate Earth - simple like original
    this.sceneSetup.earth.rotation.y += 0.001;

    // Update sun position for day/night cycle
    const time = Date.now() * 0.0001;
    const sunDistance = 500;
    this.sceneSetup.sunLight.position.set(
      Math.sin(time) * sunDistance,
      Math.cos(time * 0.5) * sunDistance,
      Math.cos(time) * sunDistance
    );

    this.renderer.render(this.scene, this.camera);
  }

  resetSatellite() {
    // Update the currently followed satellite's position using the UI fields
    const idx = this.cameraController.followSatelliteIndex;
    const satellites = this.sceneSetup.satellites;
    const states = this.physicsEngine.satellites;
    if (satellites[idx] && states[idx]) {
      const heightInput = document.getElementById("height") as HTMLInputElement;
      const earthRadius = this.EARTH_RADIUS;
      const height = parseFloat(heightInput.value) * 1000; // km to m
      const x = earthRadius + height;
      const y = 0;
      const z = 0;
      const velocityMag = parseFloat((document.getElementById("velocity") as HTMLInputElement).value);
      const directionDeg = parseFloat((document.getElementById("direction") as HTMLInputElement).value);
      const mass = parseFloat((document.getElementById("mass") as HTMLInputElement).value);
      const dragCoeff = parseFloat((document.getElementById("dragCoeff") as HTMLInputElement).value);
      const area = parseFloat((document.getElementById("area") as HTMLInputElement).value);
      const directionRad = directionDeg * Math.PI / 180;
      // Update physics state
      states[idx].position.set(x, y, z);
      states[idx].velocity.set(
        velocityMag * Math.cos(directionRad),
        velocityMag * Math.sin(directionRad),
        0
      );
      states[idx].mass = mass;
      states[idx].dragCoefficient = dragCoeff;
      states[idx].area = area;
      // Update mesh position
      satellites[idx].position.copy(states[idx].position.clone().multiplyScalar(this.SCALE_FACTOR));
      // Reset trail
      this.sceneSetup.trails[idx] = [];
      this.sceneSetup.updateTrails();
    }
  }

  toggleSimulation() {
    this.isRunning = !this.isRunning;
    const button = document.getElementById("playPause");
    if (button) {
      button.textContent = this.isRunning ? "Pause" : "Play";
    }
  }
}
