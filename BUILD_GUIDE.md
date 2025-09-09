# How to Build Module Files for GitHub Pages

This guide explains how to build the `lib/` module files from source code instead of copying them.

## 🔧 Build Process Overview

The project uses **Rollup** to bundle the source code into ES6 modules that can be imported directly in browsers.

### What Gets Built

1. **gaussian-splats-3d.module.js** - Main library (621KB)
2. **gaussian-splats-3d.module.min.js** - Minified version (255KB) 
3. **three.module.js** - Three.js library (603KB)
4. **Source maps** - For debugging

## 📋 Step-by-Step Build Process

### Method 1: Use the Build Script (Recommended)

```bash
# Make script executable (first time only)
chmod +x build-lib.sh

# Run the build script
./build-lib.sh
```

### Method 2: Manual Build

```bash
# 1. Install dependencies
npm install

# 2. Build the library using Rollup
npm run build-library

# 3. Create lib directory
mkdir -p lib

# 4. Copy Three.js modules
cp ./node_modules/three/build/three.module.js ./lib/three.module.js
cp ./node_modules/three/build/three.core.js ./lib/three.core.js

# 5. Copy built gaussian-splats-3d modules
cp ./build/gaussian-splats-3d.module.js ./lib/
cp ./build/gaussian-splats-3d.module.min.js ./lib/
cp ./build/gaussian-splats-3d.module.js.map ./lib/
cp ./build/gaussian-splats-3d.module.min.js.map ./lib/
```

## 🏗️ What Rollup Does

The `rollup.config.js` file defines how the source code gets bundled:

```javascript
// Input: ./src/index.js (main entry point)
// Output: ES6 modules in ./build/
{
    input: './src/index.js',
    external: ['three'],  // Don't bundle Three.js, import it separately
    output: {
        format: 'esm',    // ES6 module format
        file: './build/gaussian-splats-3d.module.js'
    }
}
```

### Key Features:
- **ES6 Modules**: Uses `import/export` syntax
- **External Dependencies**: Three.js is imported separately (not bundled)
- **Source Maps**: For debugging in browser dev tools
- **Minification**: Creates `.min.js` versions for production

## 📁 File Structure After Build

```
flod-3dgs-demo/
├── src/                           # Source code
│   ├── index.js                   # Main entry point
│   ├── Viewer.js                  # Main viewer class
│   ├── loaders/                   # File loaders
│   └── ...
├── build/                         # Built files
│   ├── gaussian-splats-3d.module.js
│   ├── gaussian-splats-3d.module.min.js
│   └── ...
├── lib/                           # GitHub Pages ready files
│   ├── gaussian-splats-3d.module.js
│   ├── gaussian-splats-3d.module.min.js
│   ├── three.module.js
│   └── ...
└── node_modules/three/build/      # Three.js source
    ├── three.module.js
    └── three.core.js
```

## 🔄 Build vs Copy Comparison

### ❌ Copying (What I did initially)
```bash
cp build/demo/lib/* lib/  # Just copies existing files
```

### ✅ Building (What you should do)
```bash
npm run build-library     # Builds from source
cp build/gaussian-splats-3d.module.js lib/  # Copy built files
cp node_modules/three/build/three.module.js lib/  # Copy Three.js
```

## 🎯 Why Build from Source?

1. **Always Up-to-Date**: Builds reflect latest source changes
2. **Customizable**: Can modify build settings in `rollup.config.js`
3. **Reproducible**: Anyone can build the same files from source
4. **Version Control**: Only source code in repo, not built artifacts

## 🚀 GitHub Pages Deployment

After building:

```bash
# 1. Build the lib files
./build-lib.sh

# 2. Commit the built files
git add lib/
git commit -m "Add built lib files for GitHub Pages"

# 3. Push to GitHub
git push

# 4. Enable GitHub Pages
# Repository Settings → Pages → Deploy from branch → / (root)
```

## 🔧 Customization Options

### Change Build Settings
Edit `rollup.config.js`:
```javascript
// Add more output formats
output: [
    { format: 'esm', file: './build/gaussian-splats-3d.module.js' },
    { format: 'cjs', file: './build/gaussian-splats-3d.cjs.js' },
    { format: 'iife', file: './build/gaussian-splats-3d.global.js' }
]
```

### Use Different Three.js Version
```bash
npm install three@0.160.0  # Install specific version
./build-lib.sh             # Rebuild with new version
```

### Add Build to CI/CD
```yaml
# .github/workflows/build.yml
- name: Build lib files
  run: ./build-lib.sh
  
- name: Deploy to Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./
```

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
./build-lib.sh
```

### Module Import Errors
- Check import map paths in HTML files
- Ensure `lib/` directory is committed
- Verify file permissions

### Large File Sizes
- Use `.min.js` versions for production
- Consider code splitting for very large libraries
- Use CDN for Three.js if needed

## 📚 Next Steps

1. **Build your lib files**: `./build-lib.sh`
2. **Test locally**: Open `kitchen_simple.html` in browser
3. **Deploy to GitHub Pages**: Commit and push
4. **Customize**: Modify source code and rebuild as needed

The build process ensures you always have the latest, properly bundled module files ready for GitHub Pages deployment!
