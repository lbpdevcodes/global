// globe.gl uses WebGPU only to compute heatmaps; this app draws none, so
// three/webgpu is left out of the bundle. Reaching here is a bug.
class Unused {
  constructor() {
    throw new Error("three/webgpu is stubbed out: heatmap layers are not used by this app");
  }
}
export const WebGPURenderer = Unused;
export const StorageInstancedBufferAttribute = Unused;
