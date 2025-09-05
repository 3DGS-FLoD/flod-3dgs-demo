# 3D Gaussian Splatting Library - Development Guide

## Quick Start for New Developers

### 1. Understanding the Architecture

This library implements **3D Gaussian Splatting** - a technique for rendering 3D scenes from 2D images in real-time. The core concept is that 3D scenes are represented as millions of small "splats" (3D Gaussian ellipsoids) that are sorted by depth and rendered to create the final image.

### 2. Key Concepts

- **Splats**: 3D Gaussian ellipsoids representing parts of the scene
- **Sorting**: Critical for proper depth ordering (CPU-based with WASM optimization)
- **Culling**: Octree-based system to only render visible splats
- **GPU Rendering**: Custom shaders for efficient splat rendering

### 3. Main Entry Points

```javascript
// Primary usage
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
const viewer = new GaussianSplats3D.Viewer();
viewer.addSplatScene('scene.ply').then(() => viewer.start());

// Three.js integration
const viewer = new GaussianSplats3D.DropInViewer();
threeScene.add(viewer);
```

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run demo locally
npm run demo

# Watch for changes during development
npm run watch
```

### 2. Key Files to Understand First

**Start with these files in order:**

1. **`src/index.js`** - All public exports
2. **`src/Viewer.js`** (lines 1-200) - Main class constructor and core methods
3. **`src/splatmesh/SplatMesh.js`** (lines 1-150) - Core rendering logic
4. **`src/loaders/ply/PlyLoader.js`** (lines 1-100) - File loading system

### 3. Understanding the Data Flow

```
File (.ply/.splat/.ksplat) 
    ↓
Loader (PlyLoader/SplatLoader/KSplatLoader)
    ↓
Parser (extracts splat data)
    ↓
SplatBuffer (manages splat data in memory)
    ↓
SplatScene (individual scene with transforms)
    ↓
SplatMesh (renders multiple scenes)
    ↓
GPU Textures (for efficient rendering)
```

## Common Development Tasks

### 1. Adding Support for New File Format

```javascript
// 1. Create new loader in src/loaders/
export class NewFormatLoader {
    static loadFromURL(fileName, onProgress, ...) {
        // Parse file format
        // Return SplatBuffer
    }
}

// 2. Add to index.js exports
export { NewFormatLoader };

// 3. Update Utils.js sceneFormatFromPath()
```

### 2. Modifying Rendering Behavior

```javascript
// Extend SplatMaterial3D for custom shaders
export class CustomSplatMaterial extends SplatMaterial3D {
    constructor() {
        super();
        // Modify vertex/fragment shaders
    }
}

// Update SplatMesh to use custom material
```

### 3. Performance Optimization

**Key areas for optimization:**

1. **SplatTree.js** - Octree culling algorithm
2. **SortWorker.js** - WASM-based sorting
3. **SplatMesh.js** - GPU texture management
4. **Worker/sorter.cpp** - C++ sorting implementation

### 4. Adding New Features

**Example: Adding custom UI controls**

```javascript
// 1. Create UI component in src/ui/
export class CustomControl {
    constructor(viewer) {
        this.viewer = viewer;
        this.setupUI();
    }
    
    setupUI() {
        // Create DOM elements
        // Bind event handlers
    }
}

// 2. Integrate into Viewer.js
// Add to constructor or as method
```

## Debugging and Troubleshooting

### 1. Common Issues

**Loading Problems:**
- Check file format support
- Verify CORS headers for local files
- Check SharedArrayBuffer support

**Rendering Issues:**
- Verify WebGL capabilities
- Check splat count limits
- Monitor GPU memory usage

**Performance Issues:**
- Adjust `splatSortDistanceMapPrecision`
- Toggle `integerBasedSort`
- Modify `gpuAcceleratedSort` settings

### 2. Debug Tools

```javascript
// Enable debug logging
const viewer = new GaussianSplats3D.Viewer({
    logLevel: GaussianSplats3D.LogLevel.Debug
});

// Show info panel
// Press 'I' key in demo to toggle info panel

// Monitor performance
// Info panel shows FPS, splat counts, sort duration
```

### 3. Browser DevTools

- **Performance tab**: Profile rendering performance
- **Memory tab**: Monitor GPU memory usage
- **Console**: Check for WebGL errors
- **Network tab**: Monitor file loading

## Testing Your Changes

### 1. Local Testing

```bash
# Build and test
npm run build
npm run demo

# Test with different scenes
# Use demo scenes in build/demo/assets/data/
```

### 2. Performance Testing

```javascript
// Test with large scenes
const viewer = new GaussianSplats3D.Viewer({
    sphericalHarmonicsDegree: 2, // Higher complexity
    gpuAcceleratedSort: true,
    sharedMemoryForWorkers: true
});
```

### 3. Cross-browser Testing

- Test on Chrome, Firefox, Safari
- Verify WebGL support
- Check SharedArrayBuffer availability

## Contributing Guidelines

### 1. Code Style

- Follow existing patterns
- Use ES6+ features
- Add JSDoc comments for public APIs
- Maintain backward compatibility

### 2. Performance Considerations

- Profile changes with large scenes
- Test on mobile devices
- Consider memory usage
- Optimize for 60fps rendering

### 3. Documentation

- Update README.md for new features
- Add examples for new APIs
- Document breaking changes
- Include performance notes

## Advanced Topics

### 1. WASM Development

```bash
# Modify C++ sorting code
cd src/worker/
# Edit sorter.cpp
# Recompile with provided scripts
./compile_wasm.sh
```

### 2. Shader Development

```javascript
// Custom vertex shader
const vertexShader = `
    // Custom vertex processing
    // Access splat data from textures
`;

// Custom fragment shader  
const fragmentShader = `
    // Custom pixel processing
    // Implement splat rendering
`;
```

### 3. Web Worker Optimization

```javascript
// Shared memory for large scenes
const viewer = new GaussianSplats3D.Viewer({
    sharedMemoryForWorkers: true,
    gpuAcceleratedSort: true
});
```

## Resources

### 1. External References

- [3D Gaussian Splatting Paper](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

### 2. Related Projects

- [antimatter15/splat](https://github.com/antimatter15/splat) - WebGL viewer
- [cvlab-epfl/gaussian-splatting-web](https://github.com/cvlab-epfl/gaussian-splatting-web) - WebGPU viewer

### 3. Demo Scenes

- Download from: https://projects.markkellogg.org/downloads/gaussian_splat_data.zip
- Extract to: `build/demo/assets/data/`

## Getting Help

1. **Check existing issues** on GitHub
2. **Review the demo code** in `demo/` directory
3. **Examine test scenes** for examples
4. **Use the exploration script**: `node explore_codebase.js`
5. **Enable debug logging** for detailed information

Remember: This is a complex 3D rendering library. Take time to understand the fundamentals of 3D graphics, WebGL, and the specific challenges of Gaussian splatting before making significant changes.
