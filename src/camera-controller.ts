import * as THREE from "three";
import SatelliteSimulation from "./simulation";

type CameraMode = "free" | "orbit" | "follow";

export default class CameraController {
  simulation: SatelliteSimulation;

  // Camera control state
  mode: CameraMode = "orbit";
  orbitRadius: number = 800;
  orbitPhi: number = Math.PI / 4;
  orbitTheta: number = 0;

  // Satellite follow state
  followSatelliteIndex: number = 0;

  // Free camera state
  freeCameraPosition: THREE.Vector3;
  freeCameraRotation: { x: number; y: number };
  keys: Record<string, boolean> = {};
  cameraSpeed: number = 10;

  // Mouse state
  mouseDown: boolean = false;
  lastMouseX: number = 0;
  lastMouseY: number = 0;

  constructor(simulation: SatelliteSimulation) {
    this.simulation = simulation;
    this.freeCameraPosition = new THREE.Vector3(0, 0, 800);
    this.freeCameraRotation = { x: 0, y: 0 };
    this.setupCameraControls();
  }

  setupCameraControls() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse controls
    const canvas = this.simulation.renderer.domElement;

    canvas.addEventListener("mousedown", (e) => {
      this.mouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      canvas.style.cursor = "grabbing";
    });

    document.addEventListener("mouseup", () => {
      this.mouseDown = false;
      canvas.style.cursor = "grab";
    });

    canvas.addEventListener("mousemove", (e) => {
      if (this.mouseDown && this.mode === "orbit") {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;

        // Update orbit angles
        this.orbitTheta -= deltaX * 0.01;
        this.orbitPhi -= deltaY * 0.01;

        // Constrain vertical angle to prevent camera flipping
        this.orbitPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbitPhi));

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    // Mouse wheel for zooming
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (this.mode === "orbit") {
        this.orbitRadius = Math.max(
          200,
          Math.min(2000, this.orbitRadius - e.deltaY * 0.1)
        );
      } else if (this.mode === "free") {
        this.cameraSpeed = Math.max(
          1,
          Math.min(50, this.cameraSpeed - e.deltaY * 0.01)
        );
      }
    });
  }

  handleFreeCameraInput() {
    if (this.mode !== "free") return;

    const rotationSpeed = 0.02;
    const moveSpeed = this.cameraSpeed;

    // Rotation with Arrow Keys
    if (this.keys["arrowdown"]) this.freeCameraRotation.x -= rotationSpeed; // Look down
    if (this.keys["arrowup"]) this.freeCameraRotation.x += rotationSpeed; // Look up
    if (this.keys["arrowright"]) this.freeCameraRotation.y -= rotationSpeed; // Look right
    if (this.keys["arrowleft"]) this.freeCameraRotation.y += rotationSpeed; // Look left

    // Constrain vertical rotation
    this.freeCameraRotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, this.freeCameraRotation.x)
    );

    // Calculate forward, right, and up vectors based on camera rotation
    const forward = new THREE.Vector3(
      -Math.sin(this.freeCameraRotation.y) *
        Math.cos(this.freeCameraRotation.x),
      Math.sin(this.freeCameraRotation.x),
      -Math.cos(this.freeCameraRotation.y) * Math.cos(this.freeCameraRotation.x)
    );

    const right = new THREE.Vector3(
      Math.cos(this.freeCameraRotation.y),
      0,
      -Math.sin(this.freeCameraRotation.y)
    );

    const up = new THREE.Vector3(0, 1, 0);

    // Movement with WASD
    if (this.keys["w"])
      this.freeCameraPosition.add(forward.clone().multiplyScalar(moveSpeed)); // Forward
    if (this.keys["s"])
      this.freeCameraPosition.add(forward.clone().multiplyScalar(-moveSpeed)); // Backward
    if (this.keys["a"])
      this.freeCameraPosition.add(right.clone().multiplyScalar(-moveSpeed)); // Left
    if (this.keys["d"])
      this.freeCameraPosition.add(right.clone().multiplyScalar(moveSpeed)); // Right

    // Optional: Up/Down movement with r/f
    if (this.keys["f"])
      this.freeCameraPosition.add(up.clone().multiplyScalar(-moveSpeed)); // Down
    if (this.keys["r"])
      this.freeCameraPosition.add(up.clone().multiplyScalar(moveSpeed)); // Up
  }

  updateCameraPosition() {
    // Handle keyboard input for free camera
    this.handleFreeCameraInput();

    switch (this.mode) {
      case "free":
        this.simulation.camera.position.copy(this.freeCameraPosition);

        // Calculate look target based on rotation
        const lookTarget = new THREE.Vector3(
          this.freeCameraPosition.x -
            Math.sin(this.freeCameraRotation.y) *
              Math.cos(this.freeCameraRotation.x),
          this.freeCameraPosition.y + Math.sin(this.freeCameraRotation.x),
          this.freeCameraPosition.z -
            Math.cos(this.freeCameraRotation.y) *
              Math.cos(this.freeCameraRotation.x)
        );

        this.simulation.camera.lookAt(lookTarget);
        break;

      case "orbit":
        // Calculate camera position using spherical coordinates
        const x =
          this.orbitRadius *
          Math.sin(this.orbitPhi) *
          Math.cos(this.orbitTheta);
        const y = this.orbitRadius * Math.cos(this.orbitPhi);
        const z =
          this.orbitRadius *
          Math.sin(this.orbitPhi) *
          Math.sin(this.orbitTheta);

        this.simulation.camera.position.set(x, y, z);
        this.simulation.camera.lookAt(0, 0, 0);
        break;

      case "follow":
        // Follow the selected satellite (default: first)
        const satellites = this.simulation.sceneSetup.satellites;
        const idx = Math.min(this.followSatelliteIndex, satellites.length - 1);
        if (satellites.length > 0 && satellites[idx]) {
          const satPos = satellites[idx].position.clone();
          const cameraPos = satPos.clone().add(new THREE.Vector3(0, 0, 100));
          this.simulation.camera.position.copy(cameraPos);
          this.simulation.camera.lookAt(satPos);
        }
        break;
    }

    // Update camera mode display
    const cameraModeElement = document.getElementById("cameraMode");
    if (cameraModeElement) {
      cameraModeElement.textContent =
        this.mode.charAt(0).toUpperCase() + this.mode.slice(1);
    }
  }

  setMode(mode: CameraMode) {
    this.mode = mode;

    // Update button styles
    document.querySelectorAll("#controls .scenarios button").forEach((btn) => {
      (btn as HTMLElement).style.background =
        "linear-gradient(135deg, #1e40af, #3b82f6)";
    });

    const activeButton = document.getElementById(mode + "Cam");
    if (activeButton) {
      activeButton.style.background =
        "linear-gradient(135deg, #059669, #10b981)";
    }

    // Set initial camera position for each mode
    if (mode === "free") {
      this.freeCameraPosition.set(0, 0, 800);
      this.freeCameraRotation = { x: 0, y: 0 };
    } else if (mode === "orbit") {
      // Reset to default orbit position
      this.orbitPhi = Math.PI / 4;
      this.orbitTheta = 0;
      this.orbitRadius = 800;
    }

    this.updateCameraPosition();
  }

  reset() {
    this.setMode("orbit");
    this.freeCameraPosition.set(0, 0, 800);
    this.freeCameraRotation = { x: 0, y: 0 };
  }
}
