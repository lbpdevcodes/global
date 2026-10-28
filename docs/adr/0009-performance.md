# 0009. Performance budget for the WebGL globe

- Status: Accepted
- Date: 2026-10-27

## Measured outcome

The gate is Lighthouse's desktop preset, median of three runs, run against a local Cloudflare
Pages runtime with WebGL in software (SwiftShader). On 2026-10-27 it gave:
- **Home:** performance 93, accessibility 100.
- **Country page:** performance 98, accessibility 100.

`npm run lighthouse` enforces at least 90 for both, in CI (`ci-web`) and locally.

## What got it there

1. **Unused globe.gl layers are left out of the bundle.** `vite.config.js` replaces `h3-js`
   (hexagon layers), `three/webgpu` and `three/tsl` (heatmap computation) with stubs that throw
   if ever reached. This halved the globe chunk, from 1.93 MB to 1.0 MB (279 KB gzipped).
2. **Shapes are added 8 per frame, largest first,** so building their geometry never blocks
   input for long.
3. **Polygon transitions are off,** so new shapes no longer rebuild every frame while
   animating in.
4. **Loading the globe module and constructing the globe are separate tasks.**
5. **Data is preloaded:** `index.json` and the borders from `<head>`, and on `/country/{CODE}`
   the country file, so data arrives alongside the JavaScript.
6. **The pixel ratio is capped at 1.5** to save fill work on high-density phone screens.

Coarser polygon caps (10° instead of 5°) were tried and reverted: large shapes such as Russia
and Greenland rendered with holes.

## Why the desktop preset

The PRD's performance target is "a mid-range laptop". Lighthouse's mobile preset slows the CPU
4× on top of software WebGL. There, WebGL start-up alone (about 0.9 s unthrottled in
SwiftShader) dominates, and the scores are 70 (home) and 57 (country page). Those numbers are
a known gap, kept visible here rather than hidden.

The next step, if mobile Lighthouse matters, is a leaner renderer than globe.gl: three.js with
only polygons and points. That would remove most of the remaining 1 MB.
