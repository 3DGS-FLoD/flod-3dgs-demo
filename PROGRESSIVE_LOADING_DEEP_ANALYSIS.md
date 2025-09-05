# Progressive Loading Deep Analysis: Why Multiple Scenes Are Blocked

## Executive Summary

The progressive loading restriction for multiple scenes is **NOT** due to technical limitations, but rather a **design choice** to prevent complex state management issues. The core issue is that progressive loading requires **incremental updates** to the SplatMesh, but the current implementation doesn't properly handle **multiple concurrent progressive loads**.

## Detailed Function Flow Comparison

### 1. Non-Progressive Loading Flow

#### `downloadAndBuildSingleSplatSceneStandardLoad()`
```javascript
// File: src/Viewer.js:844
downloadAndBuildSingleSplatSceneStandardLoad(path, format, splatAlphaRemovalThreshold, buildFunc, onProgress, onException, headers) {
    
    // 1. Download complete file
    const downloadPromise = this.downloadSplatSceneToSplatBuffer(path, splatAlphaRemovalThreshold, onProgress, false, undefined, format, headers);
    
    // 2. Build scene once when complete
    downloadPromise.then((splatBuffer) => {
        return buildFunc(splatBuffer, true, true).then(() => {
            downloadAndBuildPromise.resolve();
        });
    });
}
```

**Key Characteristics:**
- **Single build call**: `buildFunc(splatBuffer, true, true)`
- **Complete data**: All splat data available at once
- **Simple state**: No incremental updates needed

### 2. Progressive Loading Flow

#### `downloadAndBuildSingleSplatSceneProgressiveLoad()`
```javascript
// File: src/Viewer.js:883
downloadAndBuildSingleSplatSceneProgressiveLoad(path, format, splatAlphaRemovalThreshold, buildFunc, onDownloadProgress, onDownloadException, headers) {
    
    let progressiveLoadedSectionBuildCount = 0;
    let progressiveLoadedSectionBuilding = false;
    const queuedProgressiveLoadSectionBuilds = [];
    
    // 1. Queue system for incremental builds
    const checkAndBuildProgressiveLoadSections = () => {
        if (queuedProgressiveLoadSectionBuilds.length > 0 && !progressiveLoadedSectionBuilding) {
            progressiveLoadedSectionBuilding = true;
            const queuedBuild = queuedProgressiveLoadSectionBuilds.shift();
            
            // 2. Multiple build calls with different parameters
            buildFunc(queuedBuild.splatBuffer, queuedBuild.firstBuild, queuedBuild.finalBuild)
            .then(() => {
                progressiveLoadedSectionBuilding = false;
                // 3. Handle different promise resolutions
                if (queuedBuild.firstBuild) {
                    progressiveLoadFirstSectionBuildPromise.resolve();
                } else if (queuedBuild.finalBuild) {
                    splatSceneDownloadAndBuildPromise.resolve();
                }
            });
        }
    };
    
    // 4. Progressive section callback
    const onProgressiveLoadSectionProgress = (splatBuffer, finalBuild) => {
        queuedProgressiveLoadSectionBuilds.push({
            splatBuffer,
            firstBuild: progressiveLoadedSectionBuildCount === 0,
            finalBuild
        });
        progressiveLoadedSectionBuildCount++;
        checkAndBuildProgressiveLoadSections();
    };
    
    // 5. Download with progressive callbacks
    const splatSceneDownloadPromise = this.downloadSplatSceneToSplatBuffer(path, splatAlphaRemovalThreshold, onDownloadProgress, true, onProgressiveLoadSectionProgress, format, headers);
}
```

**Key Characteristics:**
- **Multiple build calls**: `buildFunc(splatBuffer, firstBuild, finalBuild)`
- **Incremental data**: Splat data arrives in sections
- **Complex state**: Queue system, building flags, multiple promises

## The Core Problem: SplatMesh Build Logic

### Critical Code in SplatMesh.build()
```javascript
// File: src/splatmesh/SplatMesh.js:346
let isUpdateBuild = true;
if (this.scenes.length !== 1 ||  // ← THIS IS THE PROBLEM
    this.lastBuildSceneCount !== this.scenes.length ||
    this.lastBuildMaxSplatCount !== maxSplatCount ||
    splatBuffersChanged) {
    isUpdateBuild = false;
}

if (!isUpdateBuild) {
    // Complete mesh reconstruction
    this.disposeMeshData();
    this.geometry = SplatGeometry.build(maxSplatCount);
    this.material = SplatMaterial3D.build(...);
    // ... complete rebuild
}

// Update vs rebuild
const dataUpdateResults = this.refreshGPUDataFromSplatBuffers(isUpdateBuild);
```

### The Issue Explained

1. **First Scene (progressive)**: `this.scenes.length === 1` → `isUpdateBuild = true` → **Incremental updates work**
2. **Second Scene (progressive)**: `this.scenes.length === 2` → `isUpdateBuild = false` → **Complete rebuild required**

## Progressive Loading Implementation Details

### KSplatLoader Progressive Loading
```javascript
// File: src/loaders/ksplat/KSplatLoader.js:119
const checkAndLoadSections = () => {
    if (sectionHeadersLoaded) {
        let bytesLoadedSinceLastSection = numBytesLoaded - numBytesProgressivelyLoaded;
        if (bytesLoadedSinceLastSection > Constants.ProgressiveLoadSectionSize || downloadComplete) {
            
            // 1. Update loaded counts incrementally
            directLoadSplatBuffer.updateLoadedCounts(reachedSections, loadedSplatCount);
            directLoadSplatBuffer.updateSectionLoadedCounts(i, loadedSplatCount);
            
            // 2. Trigger progressive build
            onSectionBuilt(directLoadSplatBuffer, loadComplete);
        }
    }
};
```

### SplatBuffer Progressive Updates
```javascript
// File: src/loaders/SplatBuffer.js:1038
updateLoadedCounts(newSectionCount, newSplatCount) {
    SplatBuffer.writeHeaderCountsToBuffer(newSectionCount, newSplatCount, this.bufferData);
    this.sectionCount = newSectionCount;
    this.splatCount = newSplatCount;
}

updateSectionLoadedCounts(sectionIndex, newSplatCount) {
    const sectionHeaderOffset = SplatBuffer.HeaderSizeBytes + SplatBuffer.SectionHeaderSizeBytes * sectionIndex;
    SplatBuffer.writeSectionHeaderSplatCountToBuffer(newSplatCount, this.bufferData, sectionHeaderOffset);
    this.sections[sectionIndex].splatCount = newSplatCount;
}
```

## Why Multiple Progressive Scenes Are Blocked

### 1. **State Management Complexity**
```javascript
// Progressive loading requires:
let progressiveLoadedSectionBuildCount = 0;
let progressiveLoadedSectionBuilding = false;
const queuedProgressiveLoadSectionBuilds = [];

// Multiple scenes would require:
// - Multiple queue systems
// - Multiple building flags
// - Multiple promise resolvers
// - Complex coordination between scenes
```

### 2. **SplatMesh Update Logic**
```javascript
// Current logic assumes single scene for incremental updates
if (this.scenes.length !== 1) {
    isUpdateBuild = false;  // Forces complete rebuild
}

// Multiple progressive scenes would need:
// - Per-scene update tracking
// - Incremental updates for multiple scenes
// - Complex state synchronization
```

### 3. **Promise Management**
```javascript
// Single scene progressive loading:
const progressiveLoadFirstSectionBuildPromise = abortablePromiseWithExtractedComponents();
const splatSceneDownloadAndBuildPromise = abortablePromiseWithExtractedComponents();

// Multiple scenes would need:
// - Multiple promise chains
// - Complex error handling
// - Coordination between scene promises
```

## Technical Feasibility Analysis

### What Would Be Required for Multiple Progressive Scenes

#### 1. **Enhanced State Management**
```javascript
// Instead of single scene tracking:
let progressiveLoadedSectionBuildCount = 0;
let progressiveLoadedSectionBuilding = false;
const queuedProgressiveLoadSectionBuilds = [];

// Need per-scene tracking:
const sceneProgressiveStates = new Map();
sceneProgressiveStates.set(sceneId, {
    buildCount: 0,
    building: false,
    queuedBuilds: [],
    promises: { first: null, final: null }
});
```

#### 2. **Modified SplatMesh Build Logic**
```javascript
// Instead of:
if (this.scenes.length !== 1) {
    isUpdateBuild = false;
}

// Need:
if (this.scenes.length !== 1) {
    // Check if all scenes are progressive and can be updated incrementally
    const allScenesProgressive = this.scenes.every(scene => scene.isProgressive);
    const allScenesCompatible = this.checkProgressiveCompatibility();
    isUpdateBuild = allScenesProgressive && allScenesCompatible;
}
```

#### 3. **Enhanced SplatBuffer Management**
```javascript
// Need to track multiple progressive SplatBuffers:
const progressiveSplatBuffers = new Map();
progressiveSplatBuffers.set(sceneId, {
    buffer: splatBuffer,
    loadedCount: 0,
    totalCount: 0,
    sections: []
});
```

#### 4. **Complex Promise Coordination**
```javascript
// Need to coordinate multiple progressive promises:
const scenePromises = new Map();
scenePromises.set(sceneId, {
    firstSection: abortablePromiseWithExtractedComponents(),
    final: abortablePromiseWithExtractedComponents()
});

// Coordinate all scene completions:
Promise.allSettled(Array.from(scenePromises.values()).map(p => p.final.promise))
.then(results => {
    // Handle all scenes completion
});
```

## Implementation Challenges

### 1. **Memory Management**
- Multiple progressive SplatBuffers in memory simultaneously
- Complex cleanup when scenes are removed
- Potential memory leaks if not handled properly

### 2. **Performance Impact**
- Multiple concurrent progressive updates
- Increased GPU texture updates
- More complex sorting and culling

### 3. **Error Handling**
- Complex error propagation across multiple scenes
- Partial failure scenarios (some scenes succeed, others fail)
- Cleanup of partially loaded scenes

### 4. **User Experience**
- Unpredictable loading behavior with multiple scenes
- Complex progress reporting
- Difficult to manage loading states

## Recommended Solutions

### 1. **Immediate Workaround**
```javascript
// Use addSplatScenes() for multiple scenes
viewer.addSplatScenes([
    { path: 'scene1.ksplat', progressiveLoad: false },
    { path: 'scene2.ksplat', progressiveLoad: false },
    { path: 'scene3.ksplat', progressiveLoad: false }
]);
```

### 2. **Sequential Progressive Loading**
```javascript
// Load scenes sequentially with progressive loading
async function loadScenesSequentially(scenePaths) {
    for (const path of scenePaths) {
        await viewer.addSplatScene(path, { progressiveLoad: true });
        // Wait for complete loading before next scene
    }
}
```

### 3. **Future Enhancement (Complex)**
```javascript
// Enhanced Viewer with multiple progressive scene support
class EnhancedViewer extends Viewer {
    async addSplatScenesProgressive(sceneOptions) {
        // Implement complex state management
        // Handle multiple progressive loads
        // Coordinate promises and updates
    }
}
```

## Conclusion

The progressive loading restriction for multiple scenes is a **design decision** to avoid complex state management, not a technical limitation. The current implementation could be extended to support multiple progressive scenes, but it would require:

1. **Significant refactoring** of state management
2. **Complex promise coordination**
3. **Enhanced error handling**
4. **Performance considerations**

For your use case of sequential progressive loading, the **recommended approach** is to load scenes sequentially with `progressiveLoad: true` for each individual scene, ensuring only one progressive scene is active at a time.
