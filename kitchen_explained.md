## Kitchen Demo: Code Walkthrough

This document explains the purpose of each major line/block in `demo/kitchen.html`. It follows the file top-to-bottom and focuses especially on how intrinsics/extrinsics (including roll and principal point) are applied to the Three.js camera.

### HTML Head
- `<!DOCTYPE html>`, `<html lang="en">`, `<head>...</head>`: Standard HTML scaffolding and metadata.
- Google Fonts `<link>` tags: Provide the Inter font used for UI text.
- `<script type="text/javascript" src="js/util.js"></script>`: Loads any shared utilities (if used by the page).
- `<script type="importmap">`: Maps module specifiers used by the `<script type="module">` to local paths:
  - `three` → `./lib/three.module.js`
  - `@mkkellogg/gaussian-splats-3d` → `./lib/gaussian-splats-3d.module.js`

### CSS Styles
- `:root` variables: Centralize theme colors and sizing tokens for consistent styling.
- `body`: Full-viewport black background with hidden scrollbars; sets default font.
- `.controls-overlay`: Fixed-position card with semi-transparent dark background for on-screen help and controls.
- `.control-*` classes: Small layout and typographic helpers for the overlay UI.
- `.button-container` and `.control-button`: Styles for the action buttons; hover/active transitions.
- `.eval-group` and `.eval-label`: Visual grouping for evaluation-related controls.
- Media query `@media (max-width: 768px)`: Makes the overlay UI more compact on smaller screens.

### Overlay UI Markup
- Wrapper `<div class="controls-overlay">`: The floating help/controls container.
- Control hints for movement: `WASD`, mouse look, scroll zoom.
- Evaluation controls:
  - `Set Render Size (1558x1039)`: Forces a known renderer size and aspect ratio.
  - `Switch Camera View`: Cycles through camera presets parsed from COLMAP data; shows `(current/total)`.
  - `Take Screenshot`: Hides overlay, captures canvas, triggers a download.
- Keyboard hint `R, C, S` matching the three actions above.

### Module Script: Imports
- `import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';`: Loads the viewer/splats library.
- `import * as THREE from 'three';`: Gives access to Three.js types and utilities (e.g., `Vector3`).

### URL Parameters and Mode
- `const urlParams = new URLSearchParams(window.location.search);`
- `const mode = parseInt(urlParams.get('mode')) || 5;`: Chooses which `.ksplat` level to load via `?mode=...` (defaults to 5).

### Viewer Initialization
- `new GaussianSplats3D.Viewer({...})`: Creates the viewer with initial orientation and shading parameters:
  - `cameraUp`: Default global up used before presets load.
  - `initialCameraPosition`, `initialCameraLookAt`: Starting camera placement.
  - `sphericalHarmonicsDegree`: Visual quality parameter for splats.

### Scene Path
- `let path = 'assets/flod_data/kitchen/kitchen_level' + mode + '.ksplat';`: Selects the splat scene file by `mode`.

### Camera Preset State
- `cameraPresets = []`: Holds parsed camera keyframes from COLMAP.
- `currentCameraIndex = 0`: Index used by the switch logic.

### Loading COLMAP Intrinsics/Extrinsics
#### `loadCameraPresets()`
- `fetchWithRetry(...)`: Helper to robustly fetch `cameras.bin` and `images.bin`.
- Parallel fetch of both binaries. Converts to `ArrayBuffer` and wraps in `DataView` for parsing.

#### Parse `cameras.bin` (Intrinsics)
- `numCameras = getBigUint64(0, true)`: Number of camera entries.
- For each camera entry:
  - Read `cameraId`, `modelId`, `width`, `height`.
  - Determine the number of parameters for the model (`getNumParamsForModel`).
  - Read the `params` array (e.g., `[fx, fy, cx, cy]` for PINHOLE).
  - Store in `cameras[cameraId]` with friendly `model` name via `getModelName`.

#### Parse `images.bin` (Extrinsics)
- `numRegImages = getBigUint64(0, true)`: Number of registered images.
- For each image:
  - Read `imageId`.
  - Read quaternion `qvec = [qw, qx, qy, qz]` (camera-to-world rotation).
  - Read translation `tvec = [tx, ty, tz]`.
  - Read `cameraId` and `imageName` (null-terminated string).
  - Skip 2D point data (not needed for camera pose).
  - Push a compact record to `parsedImages`.
- Sort `parsedImages` by `imageName` to ensure deterministic evaluation order.
- Take every 8th image as a preset (sampling stride for a manageable set).

#### Build Presets
- For each selected image:
  - Compute rotation matrix `R = qvec2rotmat(qvec)`.
  - Compute `Rt` (columns of `R`) to extract camera axes in world coordinates.
  - Compute world-space `position = -Rᵀ t` (standard COLMAP conversion).
  - Compute a `lookAt` point as `position + forward`, where `forward = Rt[:,2]`.
  - Attach intrinsics: `width`, `height`, `model`, `params`.
  - Save `qvec` for later to re-derive the full orientation (including roll).

### Helper Functions
- `qvec2rotmat(qvec)`: Quaternion-to-rotation-matrix conversion mimicking COLMAP’s convention.
- `getNumParamsForModel(modelId)`: Maps COLMAP camera model to number of intrinsic parameters to read.
- `getModelName(modelId)`: Maps model IDs to readable names.

### setPresetRenderSize()
- Sets the renderer to exactly `1558 × 1039` pixels.
- Forces `renderer.setPixelRatio(1.0)` to avoid device scaling.
- Updates `camera.aspect`, calls `camera.updateProjectionMatrix()`.
- Sets canvas CSS size to match, disables CSS transforms, logs result.

### switchCamera()
1. Bounds-safe `appliedIndex` and select `preset`.
2. Apply extrinsics:
   - `camera.position.set(...)` from `preset.position`.
   - `controls.target.set(...)` from `preset.lookAt`.
3. Apply roll (full orientation) from COLMAP:
   - Recompute `R` from `preset.qvec` and build `Rt`.
   - Derive camera up-axis in world: `upWorld = -Rt[:,1]`.
     - Note: COLMAP’s camera y-axis points down; negation aligns with a conventional world-up.
   - `camera.up.copy(upWorld).normalize()`.
   - `camera.lookAt(...)` again to ensure the camera respects the updated up-vector.
4. Apply intrinsics:
   - Extract `fx, fy, cx, cy` depending on the model.
   - Compute vertical FOV: `fovY = 2 * atan((height/2) / fy)`; set `camera.fov` in degrees.
   - Set `camera.aspect = width / height`.
   - Principal point alignment using `setViewOffset`:
     - `offsetX = (width/2) - cx`, `offsetY = (height/2) - cy`.
     - `camera.clearViewOffset()` then
       `camera.setViewOffset(width, height, offsetX, offsetY, width, height)`.
     - This shifts the projection center to match COLMAP’s principal point, ensuring the optical axis and framing match the original.
   - `camera.updateProjectionMatrix()`.
5. `controls.update()` to sync orbit controls.
6. Update the counter `(current/total)`.
7. Increment `currentCameraIndex` for the next switch.

### takeScreenshot()
- Temporarily hides the overlay UI.
- On the next animation frame, reads `canvas.toDataURL('image/png')` and triggers a file download.
- Restores the overlay visibility.

### Keyboard Shortcuts
- Listens to keydown:
  - `r` → `setPresetRenderSize()`
  - `c` → `switchCamera()`
  - `s` → `takeScreenshot()`

### Button Event Listeners
- Hooks UI buttons to the same functions for mouse interaction.

### Scene Loading and Startup
- `viewer.addSplatScene(path, { progressiveLoad: true })`: Loads the Gaussian splat scene.
- `viewer.start()`: Starts the render loop.
- After the scene starts, `loadCameraPresets()` runs in the background. The switch button is enabled when presets are available.

### Notes on Orientation and Principal Point
- Roll: Derived from COLMAP’s quaternion and applied by setting `camera.up` from the camera’s y-axis in world coordinates. Without this, the camera might appear correctly positioned but rotated wrongly about its forward axis.
- Principal point (`cx, cy`): If not applied, the default Three.js assumption (centered principal point) shifts the image projection. `setViewOffset` realigns the projection center, matching COLMAP image framing.


