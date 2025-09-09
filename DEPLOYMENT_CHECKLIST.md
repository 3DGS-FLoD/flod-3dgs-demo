# GitHub Pages Deployment Checklist

This guide shows exactly what files to commit and the steps to deploy your FLoD 3DGS demo to GitHub Pages.

## 📁 **Required Files for GitHub Pages**

### ✅ **Essential Files (Must Include)**
```
flod-3dgs-demo/
├── index_demo.html              # Main interactive demo
├── kitchen_simple.html          # Simple kitchen demo  
├── kitchen_interactive.html     # Interactive kitchen demo
├── lib/                         # Module files (built from source)
│   ├── gaussian-splats-3d.module.js      # 621KB
│   ├── gaussian-splats-3d.module.min.js  # 255KB
│   ├── three.module.js                   # 603KB
│   └── three.core.js                     # 1.4MB
└── docs/                        # Full demo suite (optional)
    ├── index.html
    ├── lib/
    └── ...
```

### ❌ **Files to EXCLUDE (Don't Commit)**
```
flod-3dgs-demo/
├── node_modules/                # ❌ Too large, not needed
├── build/                       # ❌ Build artifacts, not needed
├── src/                         # ❌ Source code, not needed for Pages
├── package.json                 # ❌ Not needed for static Pages
├── package-lock.json            # ❌ Not needed for static Pages
├── rollup.config.js             # ❌ Build config, not needed
├── .eslintrc.cjs                # ❌ Linting config, not needed
├── stylelintrc.json             # ❌ Linting config, not needed
├── util/                        # ❌ Build utilities, not needed
├── convert_all_scenes.sh        # ❌ Build script, not needed
├── build-lib.sh                 # ❌ Build script, not needed
└── *.md                         # ❌ Documentation, not needed for Pages
```

## 🚀 **Deployment Steps**

### **Step 1: Prepare Files**
```bash
# Make sure lib files are built
./build-lib.sh

# Check what you're about to commit
git status
```

### **Step 2: Commit Essential Files**
```bash
# Add only the files needed for GitHub Pages
git add index_demo.html
git add kitchen_simple.html  
git add kitchen_interactive.html
git add lib/
git add docs/  # Optional: full demo suite

# Commit
git commit -m "Add GitHub Pages ready demos with lib files"

# Push to GitHub
git push origin main
```

### **Step 3: Enable GitHub Pages**
1. Go to your GitHub repository
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select:
   - **Deploy from a branch**
   - **Branch**: `main` (or your default branch)
   - **Folder**: `/ (root)`
5. Click **Save**

### **Step 4: Wait for Deployment**
- GitHub will show: "Your site is being built from the `main` branch"
- Wait 2-5 minutes for deployment
- You'll see: "Your site is published at `https://yourusername.github.io/your-repo/`"

### **Step 5: Test Your Demo**
Visit these URLs:
- `https://yourusername.github.io/your-repo/` - Main demo
- `https://yourusername.github.io/your-repo/kitchen_simple.html` - Simple demo
- `https://yourusername.github.io/your-repo/kitchen_interactive.html` - Interactive demo
- `https://yourusername.github.io/your-repo/docs/` - Full demo suite

## 📋 **File Size Check**

Before committing, check file sizes:
```bash
# Check lib directory size
du -sh lib/

# Expected output: ~3-4MB total
# - gaussian-splats-3d.module.js: ~621KB
# - gaussian-splats-3d.module.min.js: ~255KB  
# - three.module.js: ~603KB
# - three.core.js: ~1.4MB
```

## 🔧 **Troubleshooting**

### **If Pages won't deploy:**
1. Check repository is public (free GitHub accounts)
2. Verify files are in root directory
3. Check for any build errors in Pages settings

### **If demos don't load:**
1. Check browser console for errors
2. Verify `lib/` files are committed
3. Check import map paths are correct

### **If models don't load:**
1. Check Hugging Face URLs are accessible
2. Verify CORS is working (should be automatic)
3. Check browser network tab for failed requests

## 🎯 **Quick Commands Summary**

```bash
# 1. Build lib files
./build-lib.sh

# 2. Add essential files
git add index_demo.html kitchen_simple.html kitchen_interactive.html lib/

# 3. Commit and push
git commit -m "Add GitHub Pages demos"
git push

# 4. Enable Pages in GitHub Settings
# 5. Wait 2-5 minutes
# 6. Test at https://yourusername.github.io/your-repo/
```

## 📊 **Repository Size**

**Before optimization:**
- With `node_modules/`, `build/`, `src/`: ~500MB+
- Too large for comfortable GitHub hosting

**After optimization:**
- Only essential files: ~10-15MB
- Fast cloning and deployment
- GitHub Pages friendly

## ✅ **Success Checklist**

- [ ] `lib/` directory contains all module files
- [ ] HTML files reference `./lib/` correctly
- [ ] `sharedMemoryForWorkers: false` in all demos
- [ ] Files committed and pushed to GitHub
- [ ] GitHub Pages enabled from root directory
- [ ] Demo loads at GitHub Pages URL
- [ ] Models load from Hugging Face
- [ ] Interactive controls work

Your demo will be live and working on GitHub Pages! 🎉
