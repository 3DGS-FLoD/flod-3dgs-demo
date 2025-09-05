# 3D Gaussian Splatting Library - Dependency Graph

## High-Level Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│  Viewer.addSplatScene() → Viewer.addSplatScenes() → Viewer.start() │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SCENE LOADING                             │
├─────────────────────────────────────────────────────────────────┤
│  PlyLoader.loadFromURL() → SplatBuffer → SplatScene            │
│  SplatLoader.loadFromURL() → SplatBuffer → SplatScene          │
│  KSplatLoader.loadFromURL() → SplatBuffer → SplatScene         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SCENE MANAGEMENT                          │
├─────────────────────────────────────────────────────────────────┤
│  SplatMesh.addSplatScene() → SplatScene → SplatBuffer          │
│  SplatMesh.updateTextures() → GPU Textures                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RENDERING PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│  SplatTree.cullSplats() → SortWorker.sortSplats() → Render     │
│  SplatMaterial3D/2D → WebGL Shaders → GPU                      │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Class Dependencies

### Core Classes

```
Viewer
├── imports: OrbitControls, PlyLoader, SplatLoader, KSplatLoader, SpzLoader
├── imports: LoadingSpinner, LoadingProgressBar, InfoPanel
├── imports: SceneHelper, Raycaster, SplatMesh, SortWorker
├── creates: SplatMesh instance
├── manages: Three.js Scene, Camera, Renderer
└── coordinates: All loading and rendering operations

SplatMesh extends THREE.Mesh
├── imports: SplatMaterial3D, SplatMaterial2D, SplatGeometry, SplatScene
├── imports: SplatTree, WebGLExtensions, WebGLCapabilities
├── contains: Multiple SplatScene instances
├── manages: GPU textures and buffers
└── handles: Rendering pipeline

SplatScene extends THREE.Object3D
├── imports: SplatBuffer
├── contains: Single scene's splat data
├── manages: Scene transforms (position, rotation, scale)
└── provides: Splat data to SplatMesh

SplatBuffer
├── contains: Raw splat data arrays
├── manages: Memory layout and optimization
└── provides: Data to SplatScene
```

### Loader System

```
PlyLoader
├── imports: PlyParser, INRIAV1PlyParser, PlayCanvasCompressedPlyParser
├── imports: SplatBuffer, SplatBufferGenerator, UncompressedSplatArray
├── creates: SplatBuffer from .ply files
└── supports: Progressive loading

SplatLoader
├── imports: SplatParser, SplatBuffer
├── creates: SplatBuffer from .splat files
└── handles: Standard splat format

KSplatLoader
├── imports: SplatBuffer
├── creates: SplatBuffer from .ksplat files
└── handles: Custom compressed format

SpzLoader
├── imports: SplatBuffer
├── creates: SplatBuffer from .spz files
└── handles: Additional compression
```

### Performance Components

```
SplatTree
├── creates: Octree structure for culling
├── uses: Web Workers for tree construction
├── provides: Culled splat lists to renderer
└── optimizes: Rendering performance

SortWorker
├── imports: WASM modules (sorter.wasm, sorter_no_simd.wasm, etc.)
├── uses: SharedArrayBuffer for data transfer
├── provides: Depth-sorted splat lists
└── optimizes: CPU-based sorting with SIMD

SplatMaterial3D/SplatMaterial2D
├── extends: THREE.ShaderMaterial
├── contains: Custom vertex/fragment shaders
├── manages: GPU texture uniforms
└── handles: Splat rendering
```

## Function Call Flow

### Scene Loading Flow:
```
1. Viewer.addSplatScene(path, options)
   ↓
2. sceneFormatFromPath(path) → determines file type
   ↓
3. PlyLoader.loadFromURL() / SplatLoader.loadFromURL() / KSplatLoader.loadFromURL()
   ↓
4. Parser.parse() → UncompressedSplatArray
   ↓
5. SplatBufferGenerator.generateFromUncompressedSplatArray()
   ↓
6. SplatBuffer → SplatScene → SplatMesh.addSplatScene()
   ↓
7. SplatMesh.updateTextures() → GPU textures
```

### Rendering Flow:
```
1. Viewer.update() (animation loop)
   ↓
2. SplatTree.cullSplats() → visible splats
   ↓
3. SortWorker.sortSplats() → depth-sorted splats
   ↓
4. SplatMesh.render() → GPU rendering
   ↓
5. SplatMaterial3D/2D → WebGL shaders
```

## Module Import Graph

```
index.js (main exports)
├── Viewer.js
│   ├── OrbitControls.js
│   ├── PlyLoader.js
│   │   ├── PlyParser.js
│   │   ├── INRIAV1PlyParser.js
│   │   ├── PlayCanvasCompressedPlyParser.js
│   │   └── SplatBuffer.js
│   ├── SplatLoader.js
│   │   └── SplatParser.js
│   ├── KSplatLoader.js
│   ├── SpzLoader.js
│   ├── SplatMesh.js
│   │   ├── SplatMaterial3D.js
│   │   ├── SplatMaterial2D.js
│   │   ├── SplatGeometry.js
│   │   ├── SplatScene.js
│   │   └── SplatTree.js
│   ├── SortWorker.js
│   ├── LoadingSpinner.js
│   ├── LoadingProgressBar.js
│   ├── InfoPanel.js
│   └── SceneHelper.js
└── DropInViewer.js
    └── Viewer.js (wrapped)
```

## Key Dependencies by Category

### Three.js Integration:
- `Viewer` → THREE.Scene, THREE.Camera, THREE.WebGLRenderer
- `SplatMesh` → THREE.Mesh, THREE.ShaderMaterial
- `SplatScene` → THREE.Object3D
- `DropInViewer` → THREE.Group

### Web Workers:
- `SortWorker` → Web Worker + WASM
- `SplatTree` → Web Worker for tree construction

### WebGL/GPU:
- `SplatMaterial3D/2D` → Custom shaders
- `WebGLExtensions` → WebGL capabilities
- `WebGLCapabilities` → Feature detection

### File I/O:
- All loaders → fetch() API
- Progressive loading → streaming

## Performance Critical Paths

1. **Loading Performance:**
   - File parsing → SplatBuffer generation → GPU texture upload
   - Progressive loading for large scenes

2. **Rendering Performance:**
   - SplatTree culling → SortWorker sorting → GPU rendering
   - WASM SIMD optimization for sorting

3. **Memory Management:**
   - SharedArrayBuffer for worker communication
   - Texture compression (16-bit/8-bit formats)
   - Splat data optimization and reordering

## Extension Points

### Adding New File Formats:
1. Create new loader in `src/loaders/`
2. Add parser for the format
3. Export from `index.js`
4. Update `sceneFormatFromPath()` in `Utils.js`

### Custom Rendering:
1. Extend `SplatMaterial3D` or `SplatMaterial2D`
2. Modify shaders in the material classes
3. Update `SplatMesh` to use custom material

### Performance Optimization:
1. Modify `SplatTree` for different culling strategies
2. Update `SortWorker` WASM code for sorting algorithms
3. Optimize texture packing in `SplatMesh`
