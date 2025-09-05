## 3D Splat Scene Loading & Rendering Flow

This document traces, in order, the functions called when a splat scene is downloaded and rendered, for both cases: `progressiveLoad = false` (standard load) and `progressiveLoad = true` (progressive/streaming load).

References are from `src/Viewer.js` (and related modules) in this repository.

---

### Standard Load (progressiveLoad = false)

High-level: download the whole file, convert to a `SplatBuffer`, build once, set up sorting, and render.

1) Caller: `Viewer.addSplatScene(path, options)`
- Determines `progressiveLoad = false` based on `options` and format.
- Prepares `buildSection` callback and `onProgress` UI handler.
- Chooses loader function:
  - `loadFunc = this.downloadAndBuildSingleSplatSceneStandardLoad.bind(this)`
- Calls:
  - `return loadFunc(path, format, options.splatAlphaRemovalThreshold, buildSection, onProgress, hideLoadingUI, options.headers)`

2) `downloadAndBuildSingleSplatSceneStandardLoad(path, format, threshold, buildFunc, onProgress, onException, headers)`
- Starts a non-progressive download:
  - `downloadPromise = this.downloadSplatSceneToSplatBuffer(path, threshold, onProgress, false, undefined, format, headers)`
- Creates a wrapper (externally controlled) promise:
  - `downloadAndBuildPromise = abortablePromiseWithExtractedComponents(downloadPromise.abortHandler)`
- On download success:
  - `removeSplatSceneDownloadPromise(downloadPromise)`
  - `return buildFunc(splatBuffer, true, true).then(() => { downloadAndBuildPromise.resolve(); clearSplatSceneDownloadAndBuildPromise(); })`
- On error:
  - Optional `onException()`
  - Clear overall tracker, remove in-flight download, reject wrapper with contextualized error
- Tracking:
  - `addSplatSceneDownloadPromise(downloadPromise)`
  - `setSplatSceneDownloadAndBuildPromise(downloadAndBuildPromise.promise)`
- Returns:
  - `downloadAndBuildPromise.promise` (resolves after download + single build complete)

3) `buildSection(splatBuffer, firstBuild=true, finalBuild=true)` (prepared in `addSplatScene`)
- Assembles `addSplatBufferOptions` (position/rotation/scale/alpha threshold).
- Calls:
  - `this.addSplatBuffers([splatBuffer], [addSplatBufferOptions], finalBuild, /*showLoadingUI for processing*/ true/false, /*showLoadingUIForSplatTreeBuild*/ true/false, /*replaceExisting*/ false, /*enableRenderBeforeFirstSort*/ false, /*preserveVisibleRegion*/ true)`

4) `addSplatBuffers(...)`
- Defers heavy work via `delayedExecute(...)`.
- Calls `addSplatBuffersToMesh(...)` to upload/update GPU data, textures, and scene structures.
- Preps/updates sort-worker:
  - Recreate worker if `maxSplatCount` changed
  - If not GPU-accelerated sort, queue centers/sceneIndexes to worker pre-sort messages
- Ensures worker exists (`setupSortWorker(...)` if needed)
- Starts/schedules sort: `runSplatSort(true, true)`
- Resolves when ready to render:
  - Immediately if no sort running, otherwise:
    - If `enableRenderBeforeFirstSort` is true: mark ready and resolve after next sort
    - Else: set ready after next sort, then resolve

Result: Once the returned promise from step (2) resolves, the scene has been fully downloaded, built once, and is ready to render; sorting has been prepared/executed appropriately.

---

### Progressive Load (progressiveLoad = true)

High-level: download in sections; each incoming section rebuilds the mesh incrementally; rendering can begin after the first section while download/build continues in background.

1) Caller: `Viewer.addSplatScene(path, options)`
- Determines `progressiveLoad = true` (format supports it and option is set).
- Prepares `buildSection` and `onProgress` handlers as above.
- Chooses loader function:
  - `loadFunc = this.downloadAndBuildSingleSplatSceneProgressiveLoad.bind(this)`
- Calls:
  - `return loadFunc(path, format, options.splatAlphaRemovalThreshold, buildSection, onProgress, hideLoadingUI, options.headers)`

2) `downloadAndBuildSingleSplatSceneProgressiveLoad(path, format, threshold, buildFunc, onDownloadProgress, onDownloadException, headers)`
- Initializes progressive build state:
  - `progressiveLoadedSectionBuildCount = 0`
  - `progressiveLoadedSectionBuilding = false`
  - `queuedProgressiveLoadSectionBuilds = []`
- Defines queue processor `checkAndBuildProgressiveLoadSections()`:
  - If queue non-empty, not currently building, and not disposing:
    - Dequeue next section → `buildFunc(splatBuffer, firstBuild, finalBuild)`
    - On build complete:
      - If first section: resolve `progressiveLoadFirstSectionBuildPromise`
      - Else if final section: resolve `splatSceneDownloadAndBuildPromise` and clear overall tracker
      - If queue still non-empty: schedule next pass via `delayedExecute(... )`
- Defines per-section progress callback `onProgressiveLoadSectionProgress(splatBuffer, finalBuild)`:
  - If not disposing, push a build job when either:
    - It is the final section, or
    - The queue is empty, or
    - The new `splatBuffer` is strictly larger (avoids redundant builds)
  - Increment section count and run the queue processor
- Starts progressive download:
  - `splatSceneDownloadPromise = this.downloadSplatSceneToSplatBuffer(path, threshold, onDownloadProgress, true, onProgressiveLoadSectionProgress, format, headers)`
- Creates two wrapper promises:
  - `progressiveLoadFirstSectionBuildPromise = abortablePromiseWithExtractedComponents(splatSceneDownloadPromise.abortHandler)`
  - `splatSceneDownloadAndBuildPromise = abortablePromiseWithExtractedComponents()`
- Tracking:
  - `addSplatSceneDownloadPromise(splatSceneDownloadPromise)`
  - `setSplatSceneDownloadAndBuildPromise(splatSceneDownloadAndBuildPromise.promise)`
- Download completion/error:
  - On success: `removeSplatSceneDownloadPromise(splatSceneDownloadPromise)`
  - On error: clear overall tracker, remove in-flight download, wrap error, reject first-section promise, call optional `onDownloadException(error)`
- Returns:
  - `progressiveLoadFirstSectionBuildPromise.promise` (resolves when first section is built → rendering can begin)

3) `buildSection(splatBuffer, firstBuild, finalBuild)`
- Same helper as standard load, but called multiple times (per section). It invokes `addSplatBuffers(...)` with:
  - `finalBuild` set appropriately per section (false for middle, true for last)
  - `replaceExisting = progressiveLoad` (so sections rebuild the same scene progressively)
  - `enableRenderBeforeFirstSort = progressiveLoad` (allow drawing ASAP in progressive mode)

4) `addSplatBuffers(...)`
- Same building, worker setup, and sort orchestration as in standard load, executed for each section.
- Rendering readiness is toggled early in progressive mode when configured, so the user sees partial content while remaining sections download/build.

Result: The returned promise resolves after the first section is built (first pixel fast). The overall completion (all sections downloaded and built) is tracked internally via `splatSceneDownloadAndBuildPromise` on the viewer.

---

### Notes on Promises & Error Handling

- Standard load returns a single wrapper promise that resolves after full download + build.
- Progressive load returns the "first section built" promise; complete lifecycle is tracked separately on the viewer through `setSplatSceneDownloadAndBuildPromise(...)`.
- On any error:
  - In-flight download tracking is removed.
  - The appropriate wrapper promise is rejected with contextualized errors via `updateError(...)`.
  - Optional error callbacks (`onException`, `onDownloadException`) are invoked.

---

### Minimal Call Stacks

Standard:
1. `Viewer.addSplatScene` →
2. `downloadAndBuildSingleSplatSceneStandardLoad` →
3. `downloadSplatSceneToSplatBuffer` (→ one of: `PlyLoader.loadFromURL` | `KSplatLoader.loadFromURL` | `SplatLoader.loadFromURL`) →
4. `buildSection` → `addSplatBuffers` → `addSplatBuffersToMesh` → `setupSortWorker?` → `runSplatSort`

Progressive:
1. `Viewer.addSplatScene` →
2. `downloadAndBuildSingleSplatSceneProgressiveLoad` →
3. `downloadSplatSceneToSplatBuffer` (progressive; per-section callback) →
4. For each section: `buildSection` → `addSplatBuffers` → `addSplatBuffersToMesh` → `setupSortWorker?` → `runSplatSort`
5. First section resolves returned promise; final section resolves the viewer’s internal overall promise.


