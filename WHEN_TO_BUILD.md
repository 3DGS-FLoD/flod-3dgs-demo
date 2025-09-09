# When to Run `./build-lib.sh`

This guide explains exactly when you need to rebuild the `lib/` files and when you don't.

## 🔧 **When You NEED to Run `./build-lib.sh`**

### ✅ **Source Code Changes**
When you modify any files in the `src/` directory:

```bash
# These changes require rebuilding:
src/Viewer.js              # Main viewer class
src/loaders/PlyLoader.js   # File loaders
src/splatmesh/SplatMesh.js # Rendering code
src/index.js               # Main entry point
src/Util.js                # Utility functions
# ... any file in src/
```

**Why?** The `lib/` files are built from `src/` using Rollup. Changes to source code won't appear until you rebuild.

### ✅ **Dependency Updates**
When you update dependencies in `package.json`:

```bash
# Update Three.js version
npm install three@0.160.0

# Update other dependencies
npm install

# Then rebuild
./build-lib.sh
```

**Why?** The build process copies Three.js from `node_modules/` to `lib/`.

### ✅ **Build Configuration Changes**
When you modify `rollup.config.js`:

```javascript
// Changes to build settings
export default [
    {
        input: './src/index.js',
        // ... any changes here
    }
];
```

**Why?** Rollup configuration affects how the modules are bundled.

## ❌ **When You DON'T Need to Run `./build-lib.sh`**

### ✅ **HTML File Changes**
```bash
# These changes DON'T require rebuilding:
index.html                 # Landing page
kitchen_simple.html        # Demo pages
kitchen_interactive.html   # Demo pages
index_demo.html           # Demo pages
```

**Why?** HTML files just reference the existing `lib/` files. No rebuilding needed.

### ✅ **CSS/Style Changes**
```bash
# These changes DON'T require rebuilding:
<style>
  body { background: red; }  # Style changes
</style>
```

**Why?** CSS is embedded in HTML, not part of the module build.

### ✅ **JavaScript Logic Changes in HTML**
```bash
# These changes DON'T require rebuilding:
<script type="module">
  // Changes to demo logic
  const viewer = new GaussianSplats3D.Viewer({...});
  // ... any changes here
</script>
```

**Why?** Demo logic is in HTML files, not in the `src/` library code.

### ✅ **Asset URL Changes**
```bash
# These changes DON'T require rebuilding:
const HF_BASE = "https://huggingface.co/your-repo/resolve/main/";
const kitchenUrl = (level) => `${HF_BASE}kitchen_level${level}.ksplat`;
```

**Why?** URL changes are in HTML files, not in the library code.

## 🔄 **Build Process Flow**

```
Source Code (src/) → Rollup → Built Modules (build/) → Copied to lib/
     ↑                    ↑                              ↑
   You edit            npm run build-library         Your HTML uses
```

## 📋 **Quick Decision Guide**

| Change Type | Need to Build? | Command |
|-------------|----------------|---------|
| HTML files | ❌ No | Just save and test |
| CSS/Styles | ❌ No | Just save and test |
| Demo JavaScript | ❌ No | Just save and test |
| Source code (`src/`) | ✅ Yes | `./build-lib.sh` |
| Dependencies | ✅ Yes | `npm install && ./build-lib.sh` |
| Rollup config | ✅ Yes | `./build-lib.sh` |

## 🚀 **Development Workflow**

### **For Demo Development (Most Common)**
```bash
# 1. Edit HTML files
vim kitchen_simple.html

# 2. Test immediately (no build needed)
# Open in browser and test

# 3. Commit changes
git add kitchen_simple.html
git commit -m "Update demo"
git push
```

### **For Library Development**
```bash
# 1. Edit source code
vim src/Viewer.js

# 2. Rebuild modules
./build-lib.sh

# 3. Test the changes
# Open HTML files in browser

# 4. Commit changes
git add src/Viewer.js lib/
git commit -m "Update viewer functionality"
git push
```

## 🔍 **How to Check if You Need to Build**

### **Method 1: Check File Timestamps**
```bash
# Check if lib files are older than src files
ls -la lib/gaussian-splats-3d.module.js
ls -la src/index.js

# If lib file is older, you need to rebuild
```

### **Method 2: Check for Errors**
```bash
# If you see module import errors in browser console:
# "Failed to resolve module specifier 'gaussian-splats-3d'"
# You might need to rebuild
```

### **Method 3: Test Changes**
```bash
# Make your change, test in browser
# If changes don't appear, you need to rebuild
```

## ⚡ **Pro Tips**

### **Use Watch Mode for Development**
```bash
# Watch for source changes and auto-rebuild
npm run watch
```

### **Quick Rebuild**
```bash
# Just rebuild the library (faster)
npm run build-library
```

### **Full Rebuild**
```bash
# Rebuild everything
./build-lib.sh
```

## 🎯 **Summary**

- **HTML/CSS/Demo changes**: No build needed ✅
- **Source code changes**: Build required ✅
- **Dependency updates**: Build required ✅
- **Most common case**: You're editing HTML files, so no build needed! 🎉

The key insight: `./build-lib.sh` is only needed when you change the **library code** (`src/`), not when you change **demo code** (HTML files).
