# GitHub Pages Setup Guide

This guide shows how to deploy the FLoD 3DGS demo to GitHub Pages without uploading build artifacts.

## Structure Overview

The project now has multiple deployment options:

### Option 1: Simple Module Structure (Recommended)
- **Files**: `index.html`, `kitchen_simple.html`, `kitchen_interactive.html`, `lib/`
- **Benefits**: No build process, direct module imports, GitHub Pages ready
- **Usage**: Just commit and push, enable Pages from root

### Option 2: Full Demo Suite
- **Files**: `docs/` directory (already set up)
- **Benefits**: Complete feature set, all original demos
- **Usage**: Enable Pages from `/docs` folder

## Quick Setup (Option 1 - Simple)

1. **Commit the essential files**:
   ```bash
   git add index.html kitchen_simple.html kitchen_interactive.html lib/
   git commit -m "Add GitHub Pages ready demo files"
   git push
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)`
   - Save

3. **Access your demo**:
   - `https://yourusername.github.io/your-repo/` - Main index
   - `https://yourusername.github.io/your-repo/kitchen_simple.html` - Simple demo
   - `https://yourusername.github.io/your-repo/kitchen_interactive.html` - Interactive demo

## Alternative Setup (Option 2 - Full Suite)

1. **Enable GitHub Pages from docs folder**:
   - Repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/docs`
   - Save

2. **Access your demo**:
   - `https://yourusername.github.io/your-repo/` - Full demo suite

## File Structure

```
flod-3dgs-demo/
├── index.html                    # Main landing page
├── kitchen_simple.html          # Simple kitchen demo
├── kitchen_interactive.html     # Interactive kitchen demo
├── lib/                         # Module files (no build needed)
│   ├── gaussian-splats-3d.module.js
│   ├── gaussian-splats-3d.module.min.js
│   ├── three.module.js
│   └── ...
├── docs/                        # Full demo suite (optional)
│   ├── index.html
│   ├── lib/
│   └── ...
└── ...
```

## Key Features

### Simple Demos
- **Direct Hugging Face loading**: No local asset uploads needed
- **Module imports**: Uses ES6 modules like mip-splatting-demo
- **No build process**: Just HTML + JS modules
- **Level switching**: Interactive level-of-detail controls

### Hugging Face Integration
- Models loaded from: `https://huggingface.co/laphisboy/flod-3dgs/resolve/main/`
- Supports all levels: `kitchen_level1.ksplat` through `kitchen_level5.ksplat`
- Easy to switch models by changing the URL pattern

## Customization

### Change Model
Edit the `kitchenUrl` function in the HTML files:
```javascript
const kitchenUrl = (level) => `${HF_BASE}your_model_level${level}.ksplat`;
```

### Add New Scenes
1. Create new HTML file (copy from `kitchen_simple.html`)
2. Update the model URL
3. Add to `index.html` demo grid

### Use Different Hugging Face Repo
Update the `HF_BASE` constant:
```javascript
const HF_BASE = "https://huggingface.co/your-username/your-repo/resolve/main/";
```

## Troubleshooting

### CORS Issues
- Hugging Face resolve URLs should work without CORS issues
- If problems occur, check browser console for specific errors

### Module Loading Issues
- Ensure `lib/` directory is committed and accessible
- Check import map paths are correct
- Verify file permissions on GitHub

### Performance
- Large `.ksplat` files may take time to load
- Consider using lower levels for faster initial load
- Progressive loading is available in interactive demos

## Benefits Over Build Process

1. **No CI/CD needed**: Just commit and push
2. **No build artifacts**: Only source files in repository
3. **Faster deployment**: Immediate updates on push
4. **Easier maintenance**: Direct file editing
5. **Smaller repo**: No large build outputs

## Next Steps

1. Choose your preferred option (simple or full suite)
2. Follow the setup steps above
3. Customize the demos for your needs
4. Share your GitHub Pages URL!

The simple module structure follows the same pattern as mip-splatting-demo, making it easy to maintain and deploy.
