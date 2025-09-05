# 3D Gaussian Splatting Library - Codebase Analysis

## Project Overview

This is a **Three.js-based 3D Gaussian Splatting renderer** that enables real-time viewing of 3D scenes generated from 2D images. The library supports multiple file formats (.ply, .splat, .ksplat) and provides both standalone and drop-in integration modes.

## Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    MAIN ENTRY POINTS                        │
├─────────────────────────────────────────────────────────────┤
│  • index.js (exports all public APIs)                      │
│  • Viewer.js (main viewer class)                           │
│  • DropInViewer.js (Three.js scene integration)            │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    CORE RENDERING                           │
├─────────────────────────────────────────────────────────────┤
│  • SplatMesh.js (main rendering container)                 │
│  • SplatMaterial3D.js / SplatMaterial2D.js (shaders)       │
│  • SplatGeometry.js (geometry management)                  │
│  • SplatScene.js (individual scene container)              │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LOADING                             │
├─────────────────────────────────────────────────────────────┤
│  • PlyLoader.js (PLY file loading)                         │
│  • SplatLoader.js (SPLAT file loading)                     │
│  • KSplatLoader.js (custom format loading)                 │
│  • SpzLoader.js (compressed format loading)                │
│  • SplatBuffer.js (data buffer management)                 │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION                             │
├─────────────────────────────────────────────────────────────┤
│  • SplatTree.js (octree for culling)                       │
│  • SortWorker.js (WASM-based sorting)                      │
│  • Compression.js (data compression)                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Classes and Their Responsibilities

### 1. **Viewer** (`src/Viewer.js`)
- **Main orchestrator** of the entire rendering pipeline
- Manages Three.js scene, camera, renderer, and controls
- Handles scene loading via `addSplatScene()` and `addSplatScenes()`
- Coordinates between SplatMesh, SortWorker, and UI components
- **Key Methods:**
  - `addSplatScene(path, options)` - Load single scene
  - `addSplatScenes(sceneOptions)` - Load multiple scenes
  - `start()` - Begin rendering loop
  - `update()` / `render()` - Animation cycle

### 2. **SplatMesh** (`src/splatmesh/SplatMesh.js`)
- **Core rendering container** extending THREE.Mesh
- Manages GPU textures and buffers for splat data
- Handles multiple SplatScene instances
- **Key Responsibilities:**
  - Texture management (covariances, colors, scales/rotations)
  - Spherical harmonics data handling
  - GPU memory optimization
  - Scene fade-in effects

### 3. **SplatScene** (`src/splatmesh/SplatScene.js`)
- **Individual scene container** extending THREE.Object3D
- Represents a single loaded splat scene
- Manages scene transforms (position, rotation, scale)
- Contains SplatBuffer with actual splat data

### 4. **Loaders** (`src/loaders/`)
- **PlyLoader**: Handles .ply files (INRIA format, PlayCanvas compressed)
- **SplatLoader**: Handles .splat files
- **KSplatLoader**: Handles custom .ksplat format
- **SpzLoader**: Handles compressed .spz format
- **SplatBuffer**: Manages splat data in memory

### 5. **SplatTree** (`src/splattree/SplatTree.js`)
- **Octree-based culling system** for performance optimization
- Pre-filters splats before sorting and rendering
- Uses web workers for tree construction

### 6. **SortWorker** (`src/worker/SortWorker.js`)
- **WASM-based splat sorting** for correct depth ordering
- Multiple variants (SIMD, non-SIMD, shared/non-shared memory)
- Critical for proper rendering of overlapping splats

## Data Flow

```
File Loading → Parsing → SplatBuffer → SplatScene → SplatMesh → Rendering
     ↓              ↓           ↓           ↓           ↓           ↓
  Loaders    →  Parsers  →  Buffers  →  Scenes  →  GPU Textures → WebGL
```

### Detailed Flow:

1. **Loading Phase:**
   - `Viewer.addSplatScene()` → `PlyLoader.loadFromURL()`
   - File parsing → `SplatBuffer` creation
   - Optional compression and optimization

2. **Scene Creation:**
   - `SplatBuffer` → `SplatScene` (with transforms)
   - `SplatScene` added to `SplatMesh`

3. **Rendering Phase:**
   - `SplatTree` culls splats based on camera view
   - `SortWorker` sorts remaining splats by depth
   - `SplatMesh` renders using GPU textures

## Key Dependencies

### External Dependencies:
- **Three.js** (>=0.160.0) - Core 3D rendering
- **WebAssembly** - High-performance splat sorting

### Internal Module Dependencies:

```
Viewer
├── SplatMesh
│   ├── SplatMaterial3D/2D
│   ├── SplatGeometry
│   ├── SplatScene
│   └── SplatTree
├── Loaders (PlyLoader, SplatLoader, etc.)
├── SortWorker (WASM)
├── OrbitControls
└── UI Components (LoadingSpinner, InfoPanel, etc.)
```

## Performance Optimizations

1. **Octree Culling** - SplatTree pre-filters visible splats
2. **WASM Sorting** - SIMD-optimized depth sorting
3. **GPU Acceleration** - Pre-computed distances on GPU
4. **Texture Compression** - 16-bit/8-bit data formats
5. **Shared Memory** - Efficient worker communication
6. **Progressive Loading** - Stream large scenes

## File Format Support

| Format | Parser | Features |
|--------|--------|----------|
| .ply | PlyLoader | INRIA v1/v2, PlayCanvas compressed |
| .splat | SplatLoader | Standard splat format |
| .ksplat | KSplatLoader | Custom compressed format |
| .spz | SpzLoader | Additional compression |

## Integration Patterns

### 1. Standalone Mode:
```javascript
const viewer = new GaussianSplats3D.Viewer();
viewer.addSplatScene('scene.ply').then(() => viewer.start());
```

### 2. Drop-in Mode:
```javascript
const viewer = new GaussianSplats3D.DropInViewer();
threeScene.add(viewer);
```

### 3. Custom Integration:
```javascript
const viewer = new GaussianSplats3D.Viewer({
    selfDrivenMode: false,
    renderer: customRenderer,
    camera: customCamera
});
```

## Development Recommendations

### For New Developers:

1. **Start with `Viewer.js`** - Main entry point and orchestrator
2. **Understand `SplatMesh.js`** - Core rendering logic
3. **Study the loader system** - How different formats are handled
4. **Examine `SortWorker.js`** - Critical performance component

### For Extensions:

1. **New File Formats**: Add to `src/loaders/` following existing patterns
2. **Custom Materials**: Extend `SplatMaterial3D.js` or `SplatMaterial2D.js`
3. **Performance**: Focus on `SplatTree.js` and `SortWorker.js`
4. **UI Components**: Add to `src/ui/` directory

### Key Files to Understand:

- `src/Viewer.js` (lines 1-100) - Constructor and main methods
- `src/splatmesh/SplatMesh.js` (lines 1-100) - Core rendering
- `src/loaders/ply/PlyLoader.js` (lines 1-100) - File loading
- `src/worker/SortWorker.js` (lines 1-50) - Performance optimization

## Build System

- **Rollup** for bundling (UMD + ESM formats)
- **Babel** for transpilation
- **ESLint** for code quality
- **WASM** compilation scripts in `src/worker/`

## Testing and Development

- Demo scenes in `demo/` directory
- Local server: `npm run demo`
- Build: `npm run build`
- Watch mode: `npm run watch`
