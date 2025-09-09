# [FLoD-3DGS Demo](https://3dgs-flod.github.io/flod-3dgs-demo/) - Web-based Interactive Viewer

**FLoD: Integrating Flexible Level of Detail into 3D Gaussian Splatting for Customizable Rendering**

This is a Three.js-based web implementation demonstrating FLoD-3DGS, a research project that integrates flexible level of detail into 3D Gaussian Splatting.

[![arXiv](https://img.shields.io/badge/arXiv-2408.128894-b31b1b.svg)](https://arxiv.org/abs/2408.12894) 
[![Project Page](https://img.shields.io/badge/Visit-Project_Page-007ec6.svg)](https://3dgs-flod.github.io/flod/)
[![Code](https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white)](https://github.com/3DGS-FLoD/flod)

## Overview

This web demo showcases FLoD-3DGS using Three.js, making the research accessible through web browsers. The 3D scenes can be viewed, navigated, and interacted with in real-time. This renderer works with FLoD-optimized `.ply` files, standard `.splat` files, or custom `.ksplat` files.

This implementation is based on [Mark Kellogg's Three.js Gaussian Splatting library](https://github.com/mkkellogg/GaussianSplats3D), adapted for FLoD research demonstration.
<br>
<br>

## Features

- Rendering is done entirely through Three.js
- Code is organized into modern ES modules
- Built-in viewer is self-contained for easy integration
- Supports `.ply` files, `.splat` files, and custom `.ksplat` files
- Built-in WebXR support
- Supports 1st and 2nd degree spherical harmonics for view-dependent effects
- Optimization features:
    - Splats culled prior to sorting & rendering using a custom octree
    - WASM splat sort: Implemented in C++ using WASM SIMD instructions
    - Partially GPU accelerated splat sort: Uses transform feedback to pre-calculate splat distances


## Controls
Mouse
- Left click to set the focal point
- Left click and drag to orbit around the focal point
- Right click and drag to pan the camera and focal point
  
Keyboard
- `C` Toggles the mesh cursor, showing the intersection point of a mouse-projected ray and the splat mesh

- `I` Toggles an info panel that displays debugging info:
  - Camera position
  - Camera focal point/look-at point
  - Camera up vector
  - Mesh cursor position
  - Current FPS
  - Renderer window size
  - Ratio of rendered splats to total splats
  - Last splat sort duration

- `U` Toggles a debug object that shows the orientation of the camera controls. It includes a green arrow representing the camera's orbital axis and a white square representing the plane at which the camera's elevation angle is 0.

- `Left arrow` Rotate the camera's up vector counter-clockwise

- `Right arrow` Rotate the camera's up vector clockwise

- `P` Toggle point-cloud mode, where each splat is rendered as a filled circle

- `=` Increase splat scale

- `-` Decrease splat scale

- `O` Toggle orthographic mode

<br>
<br>

## Credits

This web demo is based on [Mark Kellogg's Three.js Gaussian Splatting library](https://github.com/mkkellogg/GaussianSplats3D). 

<br>
<br>

## FLoD Citation

```bibtex
@article{seo2025flod,
      author  = {Yunji Seo and Young Sun Choi and Hyun Seung Son and Youngjung Uh},
      title   = {FLoD: Integrating Flexible Level of Detail into 3D Gaussian Splatting for Customizable Rendering},
      journal = {ACM Transactions on Graphics (Proceedings of SIGGRAPH)},
      number  = {4},
      volume  = {44},
      year    = {2025},
      doi     = {10.1145/3731430}
}
```
