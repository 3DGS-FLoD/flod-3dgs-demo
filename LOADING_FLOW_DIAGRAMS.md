# 3D Gaussian Splatting Loading Flow Diagrams

## Non-Progressive Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NON-PROGRESSIVE LOADING                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action: addSplatScene(path, {progressiveLoad: false})    │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 FILE DOWNLOAD                           │   │
│  │  • Download entire file to memory                       │   │
│  │  • Wait for complete download                           │   │
│  │  • File size: ~50MB (example)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 FILE PARSING                            │   │
│  │  • Parse entire file into SplatBuffer                   │   │
│  │  • Extract splat data (positions, colors, etc.)        │   │
│  │  • Memory usage: ~200MB (example)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 GPU UPLOAD                              │   │
│  │  • Upload all splat data to GPU textures               │   │
│  │  • Create vertex buffers                               │   │
│  │  • GPU memory usage: ~150MB (example)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 IMMEDIATE RENDERING                     │   │
│  │  • Scene becomes fully visible                         │   │
│  │  • All splats are rendered                             │   │
│  │  • User sees complete scene                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Progressive Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROGRESSIVE LOADING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action: addSplatScene(path, {progressiveLoad: true})     │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 STREAMING DOWNLOAD                      │   │
│  │  • Download file in chunks (e.g., 256KB sections)      │   │
│  │  • Process data as it arrives                          │   │
│  │  • Network utilization: steady                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 INCREMENTAL PARSING                     │   │
│  │  • Parse chunks as they arrive                         │   │
│  │  • Build SplatBuffer incrementally                     │   │
│  │  • Memory usage: grows gradually                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 PROGRESSIVE GPU UPLOAD                  │   │
│  │  • Update GPU textures incrementally                   │   │
│  │  • Add new splats to rendering pipeline                │   │
│  │  • GPU memory usage: grows gradually                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 GRADUAL RENDERING                       │   │
│  │  • Scene appears progressively                         │   │
│  │  • More splats become visible over time                │   │
│  │  • User sees gradual scene construction                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 COMPLETION                              │   │
│  │  • All data loaded and processed                       │   │
│  │  • Scene fully visible                                 │   │
│  │  • splatSceneDownloadAndBuildPromise resolves          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Sequential Shells Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  SEQUENTIAL SHELLS LOADING                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Shell 0: lod1_shell0.ksplat                                  │
│  Shell 1: lod1_shell1.ksplat                                  │
│  Shell 2: lod1_shell2.ksplat                                  │
│  Shell 3: lod1_shell3.ksplat                                  │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  │   Shell 0   │───▶│   Shell 1   │───▶│   Shell 2   │───▶│   Shell 3   │
│  │             │    │             │    │             │    │             │
│  │ • Load      │    │ • Load      │    │ • Load      │    │ • Load      │
│  │ • Parse     │    │ • Parse     │    │ • Parse     │    │ • Parse     │
│  │ • Upload    │    │ • Upload    │    │ • Upload    │    │ • Upload    │
│  │ • Render    │    │ • Render    │    │ • Render    │    │ • Render    │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   ▼
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  │   Scene 0   │    │   Scene 1   │    │   Scene 2   │    │   Scene 3   │
│  │   Visible   │    │   Visible   │    │   Visible   │    │   Visible   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
│                                                                 │
│  Total Time = Shell0 + Shell1 + Shell2 + Shell3                │
│  Memory Usage = Sum of all shell memory                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Settings Changes and Their Effects

### Scene Reveal Mode Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVEAL MODE CHANGES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Before Loading:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  viewer.sceneRevealMode = Default (or previous value)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  During Loading:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Non-Smooth: SceneRevealMode.Instant                    │   │
│  │  Smooth: SceneRevealMode.Gradual                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  After Loading:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  viewer.sceneRevealMode = originalRevealMode (restored) │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Effect on Subsequent Loads:                                   │
│  • Next scene will use the restored reveal mode               │
│  • If restored to Default, next scene gets default behavior   │
│  • If restored to Gradual, next scene gets gradual fade       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fade-In Rate Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                    FADE-IN RATE CHANGES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Before Loading:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  viewer.sceneFadeInRateMultiplier = 1.0 (default)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  During Loading:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Non-Smooth: No change (remains 1.0)                   │   │
│  │  Smooth: Set to 1.0 (explicit smooth rate)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│                                ▼                               │
│  After Loading:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  viewer.sceneFadeInRateMultiplier = originalFadeInRate  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Effect on Subsequent Loads:                                   │
│  • Next scene will use the restored fade-in rate              │
│  • If restored to 1.0, next scene gets default fade speed     │
│  • If restored to different value, next scene gets that rate  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Memory and Performance Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                MEMORY AND PERFORMANCE COMPARISON               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Non-Progressive Loading:                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Memory Usage:                                          │   │
│  │  • Peak: High (all data in memory at once)             │   │
│  │  • Stable: High (data remains in memory)               │   │
│  │  • GPU: High (all textures uploaded)                   │   │
│  │                                                         │   │
│  │  Performance:                                           │   │
│  │  • Loading: Fast for small scenes, slow for large      │   │
│  │  • Rendering: Immediate full capability                │   │
│  │  • Network: High initial burst, then idle              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Progressive Loading:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Memory Usage:                                          │   │
│  │  • Peak: Lower (data loaded incrementally)             │   │
│  │  • Stable: Optimized (compressed after loading)        │   │
│  │  • GPU: Gradual (textures updated incrementally)       │   │
│  │                                                         │   │
│  │  Performance:                                           │   │
│  │  • Loading: More consistent across scene sizes         │   │
│  │  • Rendering: Gradual capability increase              │   │
│  │  • Network: Steady utilization                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Takeaways

1. **Non-Progressive Loading**:
   - Better for small scenes
   - Immediate full visibility
   - Higher memory usage
   - Faster for small files

2. **Progressive Loading**:
   - Better for large scenes
   - Gradual visibility
   - Lower memory usage
   - More consistent performance

3. **Settings Restoration**:
   - All settings are restored after loading
   - Subsequent loads use restored settings
   - No permanent changes to viewer configuration

4. **Sequential vs Full Level**:
   - Sequential: Better memory management
   - Full Level: Better network efficiency
   - Choice depends on scene structure and requirements
