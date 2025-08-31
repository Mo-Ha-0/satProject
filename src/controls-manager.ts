import SatelliteSimulation from "./simulation";
import * as THREE from "three";

export default class ControlsManager {
  simulation: SatelliteSimulation;

  constructor(simulation: SatelliteSimulation) {
    this.simulation = simulation;
    this.setupControls();
  }

  setupControls() {
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
          sliderEl.value = inputEl.value;
          this.updateSimulation();
        });
      }
    });

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
}
