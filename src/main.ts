import SatelliteSimulation from "./simulation";
import * as THREE from "three";
// main.ts
window.addEventListener("DOMContentLoaded", () => {
  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.simulation) {
      window.simulation.camera.aspect = window.innerWidth / window.innerHeight;
      window.simulation.camera.updateProjectionMatrix();
      window.simulation.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  // Start simulation
  window.simulation = new SatelliteSimulation();

  // --- Satellite UI logic ---
  function updateSatelliteUI() {
    const sim = window.simulation;
    const list = document.getElementById("satellite-list");
    const followSelect = document.getElementById("followSelect") as HTMLSelectElement;
    if (!list || !followSelect) return;
    // Clear
    list.innerHTML = "";
    followSelect.innerHTML = "";
    // List satellites
    sim.sceneSetup.satellites.forEach((sat, i) => {
      const div = document.createElement("div");
      div.textContent = `Satellite ${i + 1}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        // Remove satellite and its state
        sim.scene.remove(sat);
        sim.sceneSetup.satellites.splice(i, 1);
        sim.sceneSetup.trails.splice(i, 1);
        sim.sceneSetup.trailLines[i].geometry.dispose();
        sim.scene.remove(sim.sceneSetup.trailLines[i]);
        sim.sceneSetup.trailLines.splice(i, 1);
        sim.physicsEngine.satellites.splice(i, 1);
        updateSatelliteUI();
      };
      div.appendChild(delBtn);
      list.appendChild(div);
      // Add to follow dropdown
      const opt = document.createElement("option");
      opt.value = i.toString();
      opt.textContent = `Satellite ${i + 1}`;
      followSelect.appendChild(opt);
    });
    // Set dropdown to current follow index
    followSelect.value = sim.cameraController.followSatelliteIndex.toString();
  }

  // --- Control synchronization functions ---
  function syncDragCoeffControls() {
    const rangeInput = document.getElementById("dragCoeff") as HTMLInputElement;
    const numberInput = document.getElementById("dragCoeffVal") as HTMLInputElement;
    if (rangeInput && numberInput) {
      rangeInput.value = numberInput.value;
    }
  }

  function syncAreaControls() {
    const rangeInput = document.getElementById("area") as HTMLInputElement;
    const numberInput = document.getElementById("areaVal") as HTMLInputElement;
    if (rangeInput && numberInput) {
      rangeInput.value = numberInput.value;
    }
  }

  function updateCurrentSatelliteDragProperties() {
    const sim = window.simulation;
    const currentIdx = sim.cameraController.followSatelliteIndex;
    if (sim.physicsEngine.satellites[currentIdx]) {
      const dragCoeff = parseFloat((document.getElementById("dragCoeff") as HTMLInputElement).value);
      const area = parseFloat((document.getElementById("area") as HTMLInputElement).value);
      
      sim.physicsEngine.satellites[currentIdx].dragCoefficient = dragCoeff;
      sim.physicsEngine.satellites[currentIdx].area = area;
    }
  }

  function updateDragControlsFromCurrentSatellite() {
    const sim = window.simulation;
    const currentIdx = sim.cameraController.followSatelliteIndex;
    if (sim.physicsEngine.satellites[currentIdx]) {
      const sat = sim.physicsEngine.satellites[currentIdx];
      const dragCoeffInput = document.getElementById("dragCoeff") as HTMLInputElement;
      const dragCoeffValInput = document.getElementById("dragCoeffVal") as HTMLInputElement;
      const areaInput = document.getElementById("area") as HTMLInputElement;
      const areaValInput = document.getElementById("areaVal") as HTMLInputElement;
      
      if (dragCoeffInput && dragCoeffValInput) {
        dragCoeffInput.value = (sat.dragCoefficient ?? 2.2).toString();
        dragCoeffValInput.value = (sat.dragCoefficient ?? 2.2).toString();
      }
      
      if (areaInput && areaValInput) {
        areaInput.value = (sat.area ?? 4.0).toString();
        areaValInput.value = (sat.area ?? 4.0).toString();
      }
    }
  }

  document.getElementById("addSatelliteBtn")?.addEventListener("click", async () => {
    const heightInput = document.getElementById("height") as HTMLInputElement;
    const earthRadius = window.simulation.EARTH_RADIUS;
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
    const velocity = new THREE.Vector3(
      velocityMag * Math.cos(directionRad),
      velocityMag * Math.sin(directionRad),
      0
    );
    await window.simulation.sceneSetup.addSatellite({
      position: new THREE.Vector3(x, y, z),
      velocity,
      mass,
      dragCoefficient: dragCoeff,
      area: area
    });
    updateSatelliteUI();
  });

  document.getElementById("followSelect")?.addEventListener("change", (e) => {
    const idx = parseInt((e.target as HTMLSelectElement).value, 10);
    window.simulation.cameraController.followSatelliteIndex = idx;
    updateDragControlsFromCurrentSatellite();
  });

  // --- Drag Coefficient Controls ---
  document.getElementById("dragCoeff")?.addEventListener("input", (e) => {
    const value = (e.target as HTMLInputElement).value;
    (document.getElementById("dragCoeffVal") as HTMLInputElement).value = value;
    updateCurrentSatelliteDragProperties();
  });

  document.getElementById("dragCoeffVal")?.addEventListener("input", (e) => {
    const value = (e.target as HTMLInputElement).value;
    (document.getElementById("dragCoeff") as HTMLInputElement).value = value;
    updateCurrentSatelliteDragProperties();
  });

  // --- Area Controls ---
  document.getElementById("area")?.addEventListener("input", (e) => {
    const value = (e.target as HTMLInputElement).value;
    (document.getElementById("areaVal") as HTMLInputElement).value = value;
    updateCurrentSatelliteDragProperties();
  });

  document.getElementById("areaVal")?.addEventListener("input", (e) => {
    const value = (e.target as HTMLInputElement).value;
    (document.getElementById("area") as HTMLInputElement).value = value;
    updateCurrentSatelliteDragProperties();
  });

  // --- Time Scale Preset Buttons ---
  function updateTimeScaleDisplay() {
    const sim = window.simulation;
    const display = document.querySelector('.time-scale-display');
    if (display) {
      display.textContent = `${sim.timeScale}x`;
    }
    const currentTimeScaleEl = document.getElementById('currentTimeScale');
    if (currentTimeScaleEl) {
      currentTimeScaleEl.textContent = `${sim.timeScale.toFixed(1)}x`;
    }
    
    // Update active preset button
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.classList.remove('active');
      if (parseInt(btn.getAttribute('data-speed') || '0') === Math.round(sim.timeScale)) {
        btn.classList.add('active');
      }
    });
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.getAttribute('data-speed') || '1');
      const simSpeedSlider = document.getElementById('simSpeed') as HTMLInputElement;
      const simSpeedVal = document.getElementById('simSpeedVal') as HTMLInputElement;
      
      if (simSpeedSlider && simSpeedVal) {
        simSpeedSlider.value = speed.toString();
        simSpeedVal.value = speed.toString();
        window.simulation.timeScale = speed;
        
        // Trigger controls manager update to ensure everything syncs
        window.simulation.controlsManager.updateTimeScaleDisplay();
        updateTimeScaleDisplay();
        
        console.log(`Time scale set to ${speed}x via preset button`);
      }
    });
  });

  // Override the controls manager slider events to ensure proper sync
  document.getElementById('simSpeed')?.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    window.simulation.timeScale = value;
    (document.getElementById('simSpeedVal') as HTMLInputElement).value = value.toString();
    updateTimeScaleDisplay();
    console.log(`Time scale set to ${value}x via slider`);
  });
  
  document.getElementById('simSpeedVal')?.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    window.simulation.timeScale = value;
    (document.getElementById('simSpeed') as HTMLInputElement).value = value.toString();
    updateTimeScaleDisplay();
    console.log(`Time scale set to ${value}x via input field`);
  });

  // Initial UI update after satellites are created (wait a bit for async satellite creation)
  setTimeout(() => {
    updateSatelliteUI();
    updateDragControlsFromCurrentSatellite();
    updateTimeScaleDisplay(); // Initialize time scale display
  }, 1000); // Increased timeout for async satellite loading
});
