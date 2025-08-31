import SatelliteSimulation from "./simulation";
import * as THREE from "three";

export default class ControlsManager {
  simulation: SatelliteSimulation;
  private controlsSetup: boolean = false;

  constructor(simulation: SatelliteSimulation) {
    this.simulation = simulation;
    this.setupControls();
  }

  setupControls() {
    // Prevent multiple setups
    if (this.controlsSetup) {
      return;
    }
    this.controlsSetup = true;
    
    // Sync sliders with number inputs
    const controls = [
      { slider: "simSpeed", input: "simSpeedVal" },
      { slider: "height", input: "heightVal" },
      { slider: "mass", input: "massVal" },
      { slider: "velocity", input: "velocityVal" },
      { slider: "direction", input: "directionVal" },
    ];

    controls.forEach(({ slider, input }) => {
      const sliderEl = document.getElementById(slider) as HTMLInputElement;
      const inputEl = document.getElementById(input) as HTMLInputElement;

      if (sliderEl && inputEl) {
        sliderEl.addEventListener("input", () => {
          inputEl.value = sliderEl.value;
          this.updateSimulation();
        });

        inputEl.addEventListener("input", () => {
          sliderEl.value = sliderEl.value;
          this.updateSimulation();
        });
      }
    });

    // Add satellite button
    const addSatelliteBtn = document.getElementById("addSatelliteBtn");
    if (addSatelliteBtn) {
      let isAdding = false; // Prevent multiple rapid clicks
      addSatelliteBtn.addEventListener("click", async () => {
        if (isAdding) {
          console.log("Already adding a satellite, please wait...");
          return;
        }
        isAdding = true;
        await this.addSatellite();
        isAdding = false;
      });
    }

    // Remove satellite button
    const removeSatelliteBtn = document.getElementById("removeSatelliteBtn");
    if (removeSatelliteBtn) {
      removeSatelliteBtn.addEventListener("click", () => {
        this.removeSelectedSatellite();
      });
    }

    // Follow satellite select
    const followSelect = document.getElementById("followSelect") as HTMLSelectElement;
    if (followSelect) {
      followSelect.addEventListener("change", () => {
        const selectedIndex = parseInt(followSelect.value);
        if (!isNaN(selectedIndex)) {
          this.simulation.cameraController.followSatelliteIndex = selectedIndex;
        }
      });
    }

    // Camera mode buttons
    const freeCamBtn = document.getElementById("freeCam");
    if (freeCamBtn) {
      freeCamBtn.addEventListener("click", () => {
        this.simulation.cameraController.setMode("free");
      });
    }

    const orbitCamBtn = document.getElementById("orbitCam");
    if (orbitCamBtn) {
      orbitCamBtn.addEventListener("click", () => {
        this.simulation.cameraController.setMode("orbit");
      });
    }

    const followCamBtn = document.getElementById("followCam");
    if (followCamBtn) {
      followCamBtn.addEventListener("click", () => {
        this.simulation.cameraController.setMode("follow");
      });
    }

    // Scenario buttons
    const crashScenarioBtn = document.getElementById("crashScenario");
    if (crashScenarioBtn) {
      crashScenarioBtn.addEventListener("click", () => {
        this.setScenario("crash");
      });
    }

    const orbitScenarioBtn = document.getElementById("orbitScenario");
    if (orbitScenarioBtn) {
      orbitScenarioBtn.addEventListener("click", () => {
        this.setScenario("orbit");
      });
    }

    const escapeScenarioBtn = document.getElementById("escapeScenario");
    if (escapeScenarioBtn) {
      escapeScenarioBtn.addEventListener("click", () => {
        this.setScenario("escape");
      });
    }

    // Control buttons
    const playPauseBtn = document.getElementById("playPause");
    if (playPauseBtn) {
      playPauseBtn.addEventListener("click", () => {
        this.simulation.toggleSimulation();
      });
    }

    const resetBtn = document.getElementById("reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.simulation.resetSatellite();
      });
    }

    // Initial satellite list update
    this.updateSatelliteList();
  }

  setScenario(scenario: "crash" | "orbit" | "escape") {
    const heightSlider = document.getElementById("height") as HTMLInputElement;
    const heightInput = document.getElementById(
      "heightVal"
    ) as HTMLInputElement;
    const velocitySlider = document.getElementById(
      "velocity"
    ) as HTMLInputElement;
    const velocityInput = document.getElementById(
      "velocityVal"
    ) as HTMLInputElement;
    const directionSlider = document.getElementById(
      "direction"
    ) as HTMLInputElement;
    const directionInput = document.getElementById(
      "directionVal"
    ) as HTMLInputElement;

    if (
      !heightSlider ||
      !heightInput ||
      !velocitySlider ||
      !velocityInput ||
      !directionSlider ||
      !directionInput
    )
      return;

    switch (scenario) {
      case "crash":
        heightSlider.value = heightInput.value = "300";
        velocitySlider.value = velocityInput.value = "5000";
        directionSlider.value = directionInput.value = "45";
        break;
      case "orbit":
        heightSlider.value = heightInput.value = "400";
        velocitySlider.value = velocityInput.value = "7800";
        directionSlider.value = directionInput.value = "90";
        break;
      case "escape":
        heightSlider.value = heightInput.value = "400";
        velocitySlider.value = velocityInput.value = "12000";
        directionSlider.value = directionInput.value = "90";
        break;
    }

    this.simulation.resetSatellite();
  }

  updateSimulation() {
    const simSpeedInput = document.getElementById(
      "simSpeed"
    ) as HTMLInputElement;
    if (simSpeedInput) {
      const newTimeScale = parseFloat(simSpeedInput.value);
      console.log(`Time scale changed from ${this.simulation.timeScale} to ${newTimeScale}`);
      this.simulation.timeScale = newTimeScale;
      
      // Update all time scale displays
      this.updateTimeScaleDisplay();
    }
  }

  updateTimeScaleDisplay() {
    const display = document.querySelector('.time-scale-display');
    if (display) {
      display.textContent = `${this.simulation.timeScale}x`;
    }
    const currentTimeScaleEl = document.getElementById('currentTimeScale');
    if (currentTimeScaleEl) {
      currentTimeScaleEl.textContent = `${this.simulation.timeScale}x`;
    }
    
    // Update active preset button
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.classList.remove('active');
      if (parseInt(btn.getAttribute('data-speed') || '0') === this.simulation.timeScale) {
        btn.classList.add('active');
      }
    });
  }

  async addSatellite() {
    // Get current UI values
    const heightInput = document.getElementById("height") as HTMLInputElement;
    const massInput = document.getElementById("mass") as HTMLInputElement;
    const velocityInput = document.getElementById("velocity") as HTMLInputElement;
    const directionInput = document.getElementById("direction") as HTMLInputElement;
    const dragCoeffInput = document.getElementById("dragCoeff") as HTMLInputElement;
    const areaInput = document.getElementById("area") as HTMLInputElement;

    if (!heightInput || !massInput || !velocityInput || !directionInput || !dragCoeffInput || !areaInput) {
      console.error("Required input elements not found");
      return;
    }

    const height = parseFloat(heightInput.value) * 1000; // km to m
    const mass = parseFloat(massInput.value);
    const velocityMagnitude = parseFloat(velocityInput.value);
    const directionDegrees = parseFloat(directionInput.value);
    const dragCoeff = parseFloat(dragCoeffInput.value);
    const area = parseFloat(areaInput.value);

    // Calculate position and velocity
    const earthRadius = this.simulation.EARTH_RADIUS;
    const position = new THREE.Vector3(earthRadius + height, 0, 0);
    
    // Convert direction to radians and calculate velocity components
    const directionRadians = (directionDegrees * Math.PI) / 180;
    const velocity = new THREE.Vector3(
      velocityMagnitude * Math.cos(directionRadians),
      velocityMagnitude * Math.sin(directionRadians),
      0
    );

    // Add the satellite
    await this.simulation.sceneSetup.addSatellite({
      position,
      velocity,
      mass,
      dragCoefficient: dragCoeff,
      area
    });

    // Update the satellite list
    this.updateSatelliteList();
  }

  removeSelectedSatellite() {
    const followSelect = document.getElementById("followSelect") as HTMLSelectElement;
    if (!followSelect || followSelect.value === "") return;

    const selectedIndex = parseInt(followSelect.value);
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= this.simulation.sceneSetup.satellites.length) {
      return;
    }

    // Remove from physics engine
    this.simulation.physicsEngine.satellites.splice(selectedIndex, 1);

    // Remove from scene
    const satellite = this.simulation.sceneSetup.satellites[selectedIndex];
    if (satellite) {
      this.simulation.scene.remove(satellite);
      this.simulation.sceneSetup.satellites.splice(selectedIndex, 1);
    }

    // Remove trail line
    const trailLine = this.simulation.sceneSetup.trailLines[selectedIndex];
    if (trailLine) {
      this.simulation.scene.remove(trailLine);
      this.simulation.sceneSetup.trailLines.splice(selectedIndex, 1);
    }

    // Remove trail data
    this.simulation.sceneSetup.trails.splice(selectedIndex, 1);

    // Update camera follow index if needed
    if (this.simulation.cameraController.followSatelliteIndex >= this.simulation.sceneSetup.satellites.length) {
      this.simulation.cameraController.followSatelliteIndex = Math.max(0, this.simulation.sceneSetup.satellites.length - 1);
    }

    // Update the satellite list
    this.updateSatelliteList();
  }

  updateSatelliteList() {
    const satelliteList = document.getElementById("satellite-list");
    const followSelect = document.getElementById("followSelect") as HTMLSelectElement;
    
    if (!satelliteList || !followSelect) return;

    // Clear existing list
    satelliteList.innerHTML = "";
    followSelect.innerHTML = "";

    const satellites = this.simulation.sceneSetup.satellites;
    
    if (satellites.length === 0) {
      satelliteList.innerHTML = "<div class='no-satellites'>No satellites</div>";
      followSelect.innerHTML = "<option value=''>No satellites</option>";
      return;
    }

    // Create satellite list items
    satellites.forEach((satellite, index) => {
      const listItem = document.createElement("div");
      listItem.className = "satellite-item";
      listItem.innerHTML = `
        <span class="satellite-number">Satellite ${index + 1}</span>
        <span class="satellite-position">${satellite.position.x.toFixed(0)}, ${satellite.position.y.toFixed(0)}, ${satellite.position.z.toFixed(0)}</span>
      `;
      
      // Add click handler to select this satellite
      listItem.addEventListener("click", () => {
        followSelect.value = index.toString();
        this.simulation.cameraController.followSatelliteIndex = index;
        this.updateSatelliteList(); // Refresh to show selection
      });

      // Highlight selected satellite
      if (index === this.simulation.cameraController.followSatelliteIndex) {
        listItem.classList.add("selected");
      }

      satelliteList.appendChild(listItem);

      // Add to follow select
      const option = document.createElement("option");
      option.value = index.toString();
      option.textContent = `Satellite ${index + 1}`;
      followSelect.appendChild(option);
    });

    // Set current selection
    if (satellites.length > 0) {
      followSelect.value = this.simulation.cameraController.followSatelliteIndex.toString();
    }
  }
}
