# 3D Gaussian Splatting Loading Flow Analysis

## Overview

This document analyzes the detailed loading flows for two key scenarios in the Garden Loading Speed Experiment:
1. **Non-Progressive Loading** (`progressiveLoad: false`)
2. **Progressive Loading** (`progressiveLoad: true`)

## Non-Progressive Loading Flow (`progressiveLoad: false`)

### Sequential Shells Loading
```javascript
async function loadSequentialShells(level) {
    // 1. Generate shell paths (0-3 for garden scene)
    for (let i = 0; i < 4; i++) {
        shellPaths.push(`assets/data/flod/garden/lod${level}_shell${i}.ksplat`);
    }
    
    // 2. Load each shell sequentially
    for (let i = 0; i < shellPaths.length; i++) {
        await viewer.addSplatScene(shellPath, {
            'progressiveLoad': false  // Key setting
        });
        
        // 3. Wait for complete loading before next shell
        await new Promise(requestAnimationFrame);
    }
}
```

### Full Level Loading (Non-Progressive)
```javascript
async function loadFullLevel(level) {
    await viewer.addSplatScene(levelPath, {
        'progressiveLoad': false  // Key setting
    });
    // Scene is fully loaded and visible immediately
}
```

### What Happens Internally:
1. **File Download**: Complete file is downloaded before processing
2. **Parsing**: Entire file is parsed into memory
3. **GPU Upload**: All splat data is uploaded to GPU textures
4. **Rendering**: Scene becomes fully visible immediately
5. **Memory**: Full scene data remains in memory

## Progressive Loading Flow (`progressiveLoad: true`)

### Progressive Sequential Shells
```javascript
async function loadSequentialShellsProgressive(level) {
    // 1. Set reveal mode to Instant (no gradual fade)
    viewer.sceneRevealMode = GaussianSplats3D.SceneRevealMode.Instant;
    
    // 2. Load each shell progressively
    for (let i = 0; i < shellPaths.length; i++) {
        await viewer.addSplatScene(shellPath, {
            'progressiveLoad': true  // Key setting
        });
        
        // 3. Wait for progressive loading to complete
        if (viewer.splatSceneDownloadAndBuildPromise) {
            await viewer.splatSceneDownloadAndBuildPromise;
        }
    }
}
```

### Progressive Full Level
```javascript
async function loadFullLevelProgressive(level) {
    // 1. Set reveal mode to Instant
    viewer.sceneRevealMode = GaussianSplats3D.SceneRevealMode.Instant;
    
    // 2. Load with progressive loading
    await viewer.addSplatScene(levelPath, {
        'progressiveLoad': true  // Key setting
    });
    
    // 3. Wait for progressive loading to complete
    if (viewer.splatSceneDownloadAndBuildPromise) {
        await viewer.splatSceneDownloadAndBuildPromise;
    }
}
```

### What Happens Internally:
1. **Streaming Download**: File is downloaded in chunks
2. **Incremental Parsing**: Data is parsed as it arrives
3. **Progressive GPU Upload**: Textures are updated incrementally
4. **Gradual Rendering**: Scene becomes visible progressively
5. **Memory Management**: Data is processed in sections

## Settings Changes and Their Effects

### 1. Scene Reveal Mode Changes

#### Non-Progressive Loading:
```javascript
// No reveal mode changes - uses default behavior
// Scenes appear immediately when fully loaded
```

#### Progressive Loading (Non-Smooth):
```javascript
// Before loading
const originalRevealMode = viewer.sceneRevealMode;
viewer.sceneRevealMode = GaussianSplats3D.SceneRevealMode.Instant;

// After loading
viewer.sceneRevealMode = originalRevealMode;  // Restored
```

#### Progressive Loading (Smooth):
```javascript
// Before loading
const originalRevealMode = viewer.sceneRevealMode;
viewer.sceneRevealMode = GaussianSplats3D.SceneRevealMode.Gradual;

// After loading
viewer.sceneRevealMode = originalRevealMode;  // Restored
```

### 2. Fade-In Rate Changes

#### Non-Progressive Loading:
```javascript
// No fade-in rate changes
// Uses default: sceneFadeInRateMultiplier = 1.0
```

#### Progressive Loading (Non-Smooth):
```javascript
// No fade-in rate changes
// Uses default: sceneFadeInRateMultiplier = 1.0
```

#### Progressive Loading (Smooth):
```javascript
// Before loading
const originalFadeInRate = viewer.sceneFadeInRateMultiplier;
viewer.sceneFadeInRateMultiplier = 1.0;  // Set to smooth rate

// After loading
viewer.sceneFadeInRateMultiplier = originalFadeInRate;  // Restored
```

## Effects on Subsequent Loads

### 1. Memory State
- **Non-Progressive**: Full scene data remains in GPU memory
- **Progressive**: Scene data is optimized and compressed after loading

### 2. Rendering Performance
- **Non-Progressive**: Immediate full rendering capability
- **Progressive**: Gradual rendering capability as data loads

### 3. User Experience
- **Non-Progressive**: Black screen → Full scene (instant)
- **Progressive**: Black screen → Gradual appearance → Full scene

### 4. Network Utilization
- **Non-Progressive**: High initial bandwidth, then idle
- **Progressive**: Steady bandwidth utilization over time

## Key Differences in Implementation

### Non-Progressive Loading:
```javascript
// Simple, direct loading
await viewer.addSplatScene(path, {
    'progressiveLoad': false
});
// Scene is immediately available
```

### Progressive Loading:
```javascript
// Complex loading with promise management
await viewer.addSplatScene(path, {
    'progressiveLoad': true
});

// Must wait for internal promise
if (viewer.splatSceneDownloadAndBuildPromise) {
    await viewer.splatSceneDownloadAndBuildPromise;
}
// Scene becomes available gradually
```

## Performance Implications

### Loading Time:
- **Non-Progressive**: Faster for small scenes, slower for large scenes
- **Progressive**: More consistent loading time regardless of scene size

### Memory Usage:
- **Non-Progressive**: Higher peak memory usage
- **Progressive**: Lower peak memory usage, better for large scenes

### User Experience:
- **Non-Progressive**: Better for small scenes (immediate feedback)
- **Progressive**: Better for large scenes (gradual feedback)

## Experimental Results

The experiment measures:
1. **Sequential Shells**: Loading 4 separate shell files
2. **Full Level**: Loading 1 complete level file
3. **Progressive vs Non-Progressive**: Different loading strategies
4. **Smooth vs Instant**: Different reveal modes

### Expected Outcomes:
- **Sequential Shells**: Better for memory management
- **Full Level**: Better for network efficiency
- **Progressive**: Better for large scenes
- **Non-Progressive**: Better for small scenes

## Recommendations

### Use Non-Progressive Loading When:
- Scene size is small (< 1MB)
- Immediate feedback is required
- Memory is not a constraint

### Use Progressive Loading When:
- Scene size is large (> 10MB)
- Memory is limited
- Gradual appearance is acceptable
- Network bandwidth is limited

### Use Smooth Progressive Loading When:
- User experience is prioritized
- Gradual appearance is desired
- Scene complexity is high
