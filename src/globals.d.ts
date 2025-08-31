import SatelliteSimulation from "./simulation";

declare global {
  interface Window {
    simulation: SatelliteSimulation;
  }
}
