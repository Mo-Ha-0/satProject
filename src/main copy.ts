import SatelliteSimulation from "./simulation";
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
});
