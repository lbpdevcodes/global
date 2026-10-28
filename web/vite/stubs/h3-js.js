// globe.gl's hexagon layers need h3-js; this app draws none, so the library
// (hundreds of KB) is left out of the bundle. Reaching here is a bug.
const unused = () => {
  throw new Error("h3-js is stubbed out: hexagon layers are not used by this app");
};
export const latLngToCell = unused;
export const cellToLatLng = unused;
export const cellToBoundary = unused;
export const polygonToCells = unused;
