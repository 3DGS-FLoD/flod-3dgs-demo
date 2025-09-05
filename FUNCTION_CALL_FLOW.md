# 3D Gaussian Splatting Function Call Flow Analysis

## Complete Function Call Chain from HTML to Rendering

### 1. HTML Initiation
```javascript
// From garden_loading_experiment.html
await viewer.addSplatScene(shellPath, {
    'progressiveLoad': false  // or true
});
```

### 2. Viewer.addSplatScene() Flow

#### Entry Point: `Viewer.addSplatScene(path, options)`
**File**: `src/Viewer.js:736`

**Key State Checks:**
- `this.isLoadingOrUnloading()` - Prevents concurrent loading
- `this.isDisposingOrDisposed()` - Prevents loading after disposal
- `options.progressiveLoad && this.splatMesh.scenes.length > 0` - Disables progressive for multiple scenes

**Function Calls:**
```javascript
// 1. Format detection
const format = sceneFormatFromPath(path);  // src/loaders/Utils.js

// 2. Progressive loading check
const progressiveLoad = Viewer.isProgressivelyLoadable(format) && options.progressiveLoad;

// 3. UI setup
this.loadingSpinner.addTask('Downloading...');  // src/ui/LoadingSpinner.js

// 4. Choose loading strategy
const loadFunc = progressiveLoad ? 
    this.downloadAndBuildSingleSplatSceneProgressiveLoad.bind(this) :
    this.downloadAndBuildSingleSplatSceneStandardLoad.bind(this);

// 5. Execute loading
return loadFunc(path, format, options.splatAlphaRemovalThreshold, 
               buildSection.bind(this), onProgress, hideLoadingUI.bind(this), options.headers);
```

### 3. Download Functions

#### Non-Progressive: `downloadAndBuildSingleSplatSceneStandardLoad()`
**File**: `src/Viewer.js:844`

**Function Calls:**
```javascript
// 1. Download file
const downloadPromise = this.downloadSplatSceneToSplatBuffer(path, splatAlphaRemovalThreshold, 
                                                           onProgress, false, undefined, format, headers);

// 2. Build scene
return buildFunc(splatBuffer, true, true);  // Calls buildSection()
```

#### Progressive: `downloadAndBuildSingleSplatSceneProgressiveLoad()`
**File**: `src/Viewer.js:883`

**Function Calls:**
```javascript
// 1. Download with progressive build
const splatSceneDownloadPromise = this.downloadSplatSceneToSplatBuffer(path, splatAlphaRemovalThreshold, 
                                                                      onDownloadProgress, true, 
                                                                      onProgressiveLoadSectionProgress, format, headers);

// 2. Progressive building (multiple calls)
// Each section triggers: buildFunc(splatBuffer, firstBuild, finalBuild)
```

### 4. File Download: `downloadSplatSceneToSplatBuffer()`
**File**: `src/Viewer.js:1061`

**Function Calls by Format:**
```javascript
if (format === SceneFormat.Splat) {
    return SplatLoader.loadFromURL(path, onProgress, progressiveBuild, onSectionBuilt, 
                                  splatAlphaRemovalThreshold, this.inMemoryCompressionLevel, 
                                  optimizeSplatData, headers);
} else if (format === SceneFormat.KSplat) {
    return KSplatLoader.loadFromURL(path, onProgress, progressiveBuild, onSectionBuilt, headers);
} else if (format === SceneFormat.Ply) {
    return PlyLoader.loadFromURL(path, onProgress, progressiveBuild, onSectionBuilt, 
                                splatAlphaRemovalThreshold, this.inMemoryCompressionLevel, 
                                optimizeSplatData, this.sphericalHarmonicsDegree, headers);
}
```

### 5. Loader Functions

#### KSplatLoader.loadFromURL() (for .ksplat files)
**File**: `src/loaders/ksplat/KSplatLoader.js`

**Function Calls:**
```javascript
// 1. Fetch file
fetchWithProgress(url, onProgress, headers)  // src/Util.js

// 2. Parse file
SplatBuffer.loadFromArrayBuffer(arrayBuffer, onSectionBuilt)  // src/loaders/SplatBuffer.js

// 3. Return SplatBuffer
```

#### PlyLoader.loadFromURL() (for .ply files)
**File**: `src/loaders/ply/PlyLoader.js`

**Function Calls:**
```javascript
// 1. Fetch file
fetchWithProgress(fileName, onProgress, headers)

// 2. Parse based on format
if (format === PlyFormat.INRIAV1) {
    INRIAV1PlyParser.parse(plyBuffer, onProgress, progressiveLoadToSplatBuffer, 
                          onProgressiveLoadSectionProgress, minimumAlpha, 
                          outSphericalHarmonicsDegree)  // src/loaders/ply/INRIAV1PlyParser.js
} else if (format === PlyFormat.INRIAV2) {
    INRIAV2PlyParser.parse(...)  // src/loaders/ply/INRIAV2PlyParser.js
} else if (format === PlyFormat.PlayCanvasCompressed) {
    PlayCanvasCompressedPlyParser.parse(...)  // src/loaders/ply/PlayCanvasCompressedPlyParser.js
}

// 3. Generate SplatBuffer
SplatBufferGenerator.generateFromUncompressedSplatArray(splatData)  // src/loaders/SplatBufferGenerator.js
```

### 6. Build Section: `buildSection()`
**File**: `src/Viewer.js:809`

**Function Calls:**
```javascript
// 1. Add splat buffers to mesh
return this.addSplatBuffers([splatBuffer], [addSplatBufferOptions],
                           finalBuild, firstBuild && showLoadingUI, showLoadingUI,
                           progressiveLoad, progressiveLoad);
```

### 7. Add Splat Buffers: `addSplatBuffers()`
**File**: `src/Viewer.js:1094`

**Function Calls:**
```javascript
// 1. Add to mesh
const buildResults = this.addSplatBuffersToMesh(splatBuffers, splatBufferOptions, finalBuild,
                                               showLoadingUIForSplatTreeBuild, replaceExisting,
                                               preserveVisibleRegion);
```

### 8. Add Splat Buffers to Mesh: `addSplatBuffersToMesh()`
**File**: `src/Viewer.js:1189`

**Key State Management:**
```javascript
// 1. Preserve existing scenes
if (!replaceExisting) {
    allSplatBuffers = this.splatMesh.scenes.map((scene) => scene.splatBuffer) || [];
    allSplatBufferOptions = this.splatMesh.sceneOptions ? this.splatMesh.sceneOptions.map((sceneOptions) => sceneOptions) : [];
}

// 2. Add new scenes
allSplatBuffers.push(...splatBuffers);
allSplatBufferOptions.push(...splatBufferOptions);

// 3. Build mesh
const buildResults = this.splatMesh.build(allSplatBuffers, allSplatBufferOptions, true, finalBuild, 
                                         onSplatTreeIndexesUpload, onSplatTreeReady, preserveVisibleRegion);
```

### 9. SplatMesh.build()
**File**: `src/splatmesh/SplatMesh.js:306`

**Function Calls:**
```javascript
// 1. Calculate max splat count
const maxSplatCount = SplatMesh.getTotalMaxSplatCountForSplatBuffers(splatBuffers);

// 2. Build scenes
const newScenes = SplatMesh.buildScenes(this, splatBuffers, sceneOptions);

// 3. Update scenes array
this.scenes = newScenes;

// 4. Update textures and geometry
this.updateTextures();
this.updateGeometry();

// 5. Build splat tree (for culling)
if (this.splatTree) {
    this.splatTree.build(this.scenes, onSplatTreeIndexesUpload, onSplatTreeConstruction);
}
```

### 10. SplatMesh.updateTextures()
**File**: `src/splatmesh/SplatMesh.js`

**Function Calls:**
```javascript
// 1. Calculate texture sizes
const covTexSize = SplatMesh.calculateCovariancesTextureSize(maxSplatCount, this.halfPrecisionCovariancesOnGPU);
const scaleRotationsTexSize = SplatMesh.calculateScaleRotationsTextureSize(maxSplatCount);
const centerColorsTexSize = SplatMesh.calculateCenterColorsTextureSize(maxSplatCount);
const shTexSize = SplatMesh.calculateSphericalHarmonicsTextureSize(maxSplatCount, this.minSphericalHarmonicsDegree);

// 2. Create/update textures
this.covariancesTexture = new THREE.DataTexture(covariancesTextureData, covTexSize.x, covTexSize.y, ...);
this.scaleRotationsTexture = new THREE.DataTexture(scaleRotationsTextureData, scaleRotationsTexSize.x, scaleRotationsTexSize.y, ...);
this.centerColorsTexture = new THREE.DataTexture(centerColorsTextureData, centerColorsTexSize.x, centerColorsTexSize.y, ...);
this.sphericalHarmonicsTexture = new THREE.DataTexture(sphericalHarmonicsTextureData, shTexSize.x, shTexSize.y, ...);

// 3. Update material uniforms
this.material.uniforms.covariancesTexture.value = this.covariancesTexture;
this.material.uniforms.scaleRotationsTexture.value = this.scaleRotationsTexture;
this.material.uniforms.centerColorsTexture.value = this.centerColorsTexture;
this.material.uniforms.sphericalHarmonicsTexture.value = this.sphericalHarmonicsTexture;
```

### 11. SplatTree.build()
**File**: `src/splattree/SplatTree.js`

**Function Calls:**
```javascript
// 1. Create worker for tree construction
const splatTreeWorker = new Worker(new Blob(['(', createSplatTreeWorker.toString(), ')(self)'], {
    type: 'application/javascript'
}));

// 2. Send splat data to worker
splatTreeWorker.postMessage({
    splatCenters: this.splatCenters,
    maxDepth: this.maxDepth,
    maxCentersPerNode: this.maxCentersPerNode
});

// 3. Receive tree structure
splatTreeWorker.onmessage = (e) => {
    // Process tree nodes and build octree structure
};
```

### 12. Sort Worker Setup: `setupSortWorker()`
**File**: `src/Viewer.js:1235`

**Function Calls:**
```javascript
// 1. Create sort worker
this.sortWorker = createSortWorker(maxSplatCount, this.sharedMemoryForWorkers, this.enableSIMDInSort,
                                  this.integerBasedSort, this.splatMesh.dynamicMode, this.splatSortDistanceMapPrecision);

// 2. Setup shared memory (if enabled)
if (this.sharedMemoryForWorkers) {
    this.sortWorkerSortedIndexes = new Uint32Array(e.data.sortedIndexesBuffer, e.data.sortedIndexesOffset, maxSplatCount);
    this.sortWorkerIndexesToSort = new Uint32Array(e.data.indexesToSortBuffer, e.data.indexesToSortOffset, maxSplatCount);
    this.sortWorkerPrecomputedDistances = new DistancesArrayType(e.data.precomputedDistancesBuffer, e.data.precomputedDistancesOffset, maxSplatCount);
}
```

## State Changes and Effects for Subsequent Loads

### 1. Viewer State Changes

#### Loading State Management:
```javascript
// Before loading
this.splatSceneDownloadPromises = {};  // Track active downloads
this.splatSceneDownloadAndBuildPromise = null;  // Current build promise

// During loading
this.addSplatSceneDownloadPromise(downloadPromise);  // Add to tracking
this.setSplatSceneDownloadAndBuildPromise(downloadAndBuildPromise.promise);  // Set current promise

// After loading
this.removeSplatSceneDownloadPromise(downloadPromise);  // Remove from tracking
this.clearSplatSceneDownloadAndBuildPromise();  // Clear current promise
```

#### Progressive Loading Restriction:
```javascript
// Critical state check
if (options.progressiveLoad && this.splatMesh.scenes && this.splatMesh.scenes.length > 0) {
    console.log('addSplatScene(): "progressiveLoad" option ignore because there are multiple splat scenes');
    options.progressiveLoad = false;  // FORCED TO FALSE
}
```

### 2. SplatMesh State Changes

#### Scene Management:
```javascript
// Before: this.splatMesh.scenes = [existing_scenes]
// After: this.splatMesh.scenes = [existing_scenes, new_scene]

// Scene options preserved
this.splatMesh.sceneOptions = [existing_options, new_options];
```

#### Texture Updates:
```javascript
// All textures are recreated/updated
this.covariancesTexture = new THREE.DataTexture(...);
this.scaleRotationsTexture = new THREE.DataTexture(...);
this.centerColorsTexture = new THREE.DataTexture(...);
this.sphericalHarmonicsTexture = new THREE.DataTexture(...);

// Material uniforms updated
this.material.uniforms.covariancesTexture.value = this.covariancesTexture;
// ... other uniforms
```

#### Geometry Updates:
```javascript
// Geometry is updated with new splat count
this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
// ... other attributes
```

### 3. Sort Worker State Changes

#### Worker Recreation:
```javascript
// Each new scene triggers sort worker recreation
this.sortWorker = createSortWorker(maxSplatCount, this.sharedMemoryForWorkers, ...);

// Shared memory arrays recreated
this.sortWorkerSortedIndexes = new Uint32Array(maxSplatCount);
this.sortWorkerIndexesToSort = new Uint32Array(maxSplatCount);
this.sortWorkerPrecomputedDistances = new DistancesArrayType(maxSplatCount);
```

### 4. SplatTree State Changes

#### Tree Reconstruction:
```javascript
// Entire tree is rebuilt with all scenes
this.splatTree.build(this.scenes, onSplatTreeIndexesUpload, onSplatTreeConstruction);

// Tree structure completely replaced
this.splatTree.rootNode = newRootNode;
this.splatTree.nodes = newNodes;
```

## Critical State Effects for Sequential Loading

### 1. Progressive Loading Disabled
**Most Important Effect**: Once the first scene is loaded, `progressiveLoad` is **automatically disabled** for all subsequent scenes.

```javascript
// First scene: progressiveLoad = true (if specified)
// Second scene: progressiveLoad = false (FORCED)
// Third scene: progressiveLoad = false (FORCED)
```

### 2. Memory Accumulation
```javascript
// Each scene adds to memory usage
// Scene 1: ~200MB
// Scene 2: ~400MB (Scene 1 + Scene 2)
// Scene 3: ~600MB (Scene 1 + Scene 2 + Scene 3)
```

### 3. Sort Worker Recreation
```javascript
// Each new scene triggers complete sort worker recreation
// This includes:
// - WASM module reload
// - Shared memory reallocation
// - Worker thread restart
```

### 4. Texture Recreation
```javascript
// All GPU textures are recreated for each scene
// This includes:
// - GPU memory allocation
// - Texture data upload
// - Material uniform updates
```

### 5. SplatTree Reconstruction
```javascript
// Entire octree is rebuilt for each scene
// This includes:
// - Worker thread for tree construction
// - Complete tree structure replacement
// - Culling data regeneration
```

## Performance Implications

### 1. Loading Time
- **First scene**: Fast (progressive loading possible)
- **Subsequent scenes**: Slower (progressive loading disabled)
- **Memory usage**: Linear growth with each scene

### 2. Rendering Performance
- **Sort worker**: Recreated for each scene (expensive)
- **Textures**: Recreated for each scene (GPU memory intensive)
- **SplatTree**: Rebuilt for each scene (CPU intensive)

### 3. Memory Management
- **No cleanup**: Previous scenes remain in memory
- **GPU memory**: Accumulates with each scene
- **Worker memory**: Recreated for each scene

## Recommendations for Sequential Loading

### 1. Use Non-Progressive Loading
Since progressive loading is disabled after the first scene, always use `progressiveLoad: false` for sequential scenes.

### 2. Monitor Memory Usage
Track memory usage as scenes are added to prevent memory exhaustion.

### 3. Consider Scene Removal
Implement `removeSplatScene()` to clean up unused scenes.

### 4. Optimize Sort Worker
Consider reusing sort workers or implementing incremental updates.

### 5. Batch Loading
Load multiple scenes in a single `addSplatScenes()` call when possible to reduce overhead.
