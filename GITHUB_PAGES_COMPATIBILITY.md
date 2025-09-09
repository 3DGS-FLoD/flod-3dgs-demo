# GitHub Pages Compatibility Guide

This guide explains how to make FLoD 3DGS demos work on GitHub Pages without the `enable-threads.js` file.

## 🚫 **Why `enable-threads.js` is NOT needed for GitHub Pages**

### **What `enable-threads.js` does:**
- Sets up Cross-Origin Isolation headers (COOP/COEP)
- Enables `SharedArrayBuffer` for faster web worker communication
- Requires server-side CORS headers that GitHub Pages can't provide

### **Why GitHub Pages can't use it:**
- GitHub Pages is a static hosting service
- No server-side configuration for custom headers
- No support for Cross-Origin Isolation policies

## ✅ **Recommended Solution: Disable Shared Memory**

Instead of `enable-threads.js`, explicitly disable shared memory in your viewer configuration:

```javascript
const viewer = new GaussianSplats3D.Viewer({
  cameraUp: [0, -1, -0.17],
  initialCameraPosition: [-5, -1, -1],
  initialCameraLookAt: [-1.72477, 0.05395, -0.00147],
  freeIntermediateSplatData: true,
  sharedMemoryForWorkers: false,  // Disable for GitHub Pages compatibility
});
```

## 🔧 **Performance Impact**

### **With Shared Memory (enable-threads.js):**
- ✅ Faster web worker communication
- ✅ Better performance for large scenes
- ❌ Requires server-side headers
- ❌ Not compatible with GitHub Pages

### **Without Shared Memory (GitHub Pages):**
- ✅ Works on any static hosting
- ✅ No server configuration needed
- ✅ Compatible with GitHub Pages
- ⚠️ Slightly slower web worker communication
- ⚠️ Still very good performance for most scenes

## 📋 **Updated Demo Files**

All demo files have been updated to include `sharedMemoryForWorkers: false`:

- `kitchen_simple.html` ✅
- `kitchen_interactive.html` ✅  
- `index_demo.html` ✅

## 🎯 **Comparison: mip-splatting-demo vs flod-3dgs-demo**

### **mip-splatting-demo:**
```html
<!-- Uses enable-threads.js -->
<script type="text/javascript" src="enable-threads.js"></script>
<script type="importmap">
{
    "imports": {
        "three": "./lib/three.module.js",
        "gaussian-splats-3d": "./lib/gaussian-splats-3d.module.js"
    }
}
</script>
```

### **flod-3dgs-demo (GitHub Pages compatible):**
```html
<!-- No enable-threads.js needed -->
<script type="importmap">
{
    "imports": {
        "three": "./lib/three.module.js",
        "gaussian-splats-3d": "./lib/gaussian-splats-3d.module.js"
    }
}
</script>
<script type="module">
    const viewer = new GaussianSplats3D.Viewer({
        // ... other options
        sharedMemoryForWorkers: false,  // GitHub Pages compatible
    });
</script>
```

## 🚀 **Deployment Steps**

1. **Build the lib files:**
   ```bash
   ./build-lib.sh
   ```

2. **Commit and push:**
   ```bash
   git add lib/ kitchen_simple.html kitchen_interactive.html index_demo.html
   git commit -m "Add GitHub Pages compatible demos"
   git push
   ```

3. **Enable GitHub Pages:**
   - Repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/ (root)`

4. **Test your demo:**
   - `https://yourusername.github.io/your-repo/kitchen_simple.html`

## 🔍 **How to Check if Shared Memory is Working**

### **In Browser Console:**
```javascript
// Check if SharedArrayBuffer is available
console.log(typeof SharedArrayBuffer !== 'undefined' ? 'Available' : 'Not available');

// Check if cross-origin isolation is enabled
console.log(window.crossOriginIsolated ? 'Enabled' : 'Disabled');
```

### **Expected Results on GitHub Pages:**
- `SharedArrayBuffer`: "Not available"
- `crossOriginIsolated`: "Disabled"
- **Demo still works perfectly!** ✅

## 🎯 **Summary**

- **Don't use `enable-threads.js`** for GitHub Pages
- **Set `sharedMemoryForWorkers: false`** in viewer options
- **Performance is still excellent** for most use cases
- **Works on any static hosting** without server configuration

The demos will work perfectly on GitHub Pages without any additional files or server configuration!
