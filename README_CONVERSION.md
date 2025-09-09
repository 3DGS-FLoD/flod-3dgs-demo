# FLOD 3DGS Demo - KSPLAT Conversion & Interactive Level Switching

This document explains how to use the new system for converting PLY files to KSPLAT format with scale constraints and interactive level switching.

## 🎯 What This System Does

1. **Converts PLY files to KSPLAT format** for all 5 LOD levels
2. **Applies scale constraints** to levels 1-4 to create visual differences
3. **Provides interactive level switching** in the web interface
4. **Automatically handles file management** and conversion

## 📁 File Structure

```
flod-3dgs-demo-built/
├── convert_ply_to_ksplat_with_scale.py    # Main conversion script
├── requirements.txt                         # Python dependencies
├── convert_all_scenes.sh                   # Batch conversion script
├── demo/
│   ├── kitchen.html                        # Kitchen scene with level switching
│   ├── 58e7.html                          # 58e7 scene with level switching
│   └── assets/flod_data/
│       ├── kitchen/                        # Kitchen scene data
│       │   └── point_cloud/
│       │       ├── lod_1_iteration_10000/  # Level 1 (10k iterations)
│       │       ├── lod_2_iteration_15000/  # Level 2 (15k iterations)
│       │       ├── lod_3_iteration_20000/  # Level 3 (20k iterations)
│       │       ├── lod_4_iteration_25000/  # Level 4 (25k iterations)
│       │       └── lod_5_iteration_30000/  # Level 5 (30k iterations)
│       └── 58e7/                          # 58e7 scene data
│           └── point_cloud/
│               ├── lod_1_iteration_10000/  # Level 1 (10k iterations)
│               ├── lod_2_iteration_15000/  # Level 2 (15k iterations)
│               ├── lod_3_iteration_20000/  # Level 3 (20k iterations)
│               ├── lod_4_iteration_25000/  # Level 4 (25k iterations)
│               └── lod_5_iteration_30000/  # Level 5 (30k iterations)
```

## 🚀 Quick Start

### Step 1: Install Python Dependencies
```bash
cd flod-3dgs-demo-built
pip3 install -r requirements.txt
```

### Step 2: Convert All Scenes (Recommended)
```bash
# Make the script executable
chmod +x convert_all_scenes.sh

# Run the conversion for all scenes
./convert_all_scenes.sh
```

### Step 3: Test the Interactive Interface
1. Open `demo/kitchen.html` or `demo/58e7.html` in a web browser
2. Use the level selection buttons in the top-left corner
3. Watch the information panel at the bottom-left for current level details

## 🔧 Manual Conversion

### Convert a Single Scene
```bash
# Convert kitchen scene
python3 convert_ply_to_ksplat_with_scale.py kitchen

# Convert 58e7 scene
python3 convert_ply_to_ksplat_with_scale.py 58e7
```

### Convert a Specific File
```bash
python3 convert_ply_to_ksplat_with_scale.py input.ply output.ksplat 3
```

## 📊 Scale Constraints Explained

The system applies different scale constraints to create visual differences between LOD levels:

| Level | Iterations | Scale Factor | Visual Effect |
|-------|------------|--------------|---------------|
| 1     | 10k        | 0.3x         | 70% smaller objects |
| 2     | 15k        | 0.5x         | 50% smaller objects |
| 3     | 20k        | 0.7x         | 30% smaller objects |
| 4     | 25k        | 0.85x        | 15% smaller objects |
| 5     | 30k        | 1.0x         | No scaling (original) |

## 🎮 Interactive Level Switching

### Features
- **5 Level Buttons**: Each representing a different LOD level
- **Real-time Switching**: Click any level to load it instantly
- **Loading Indicators**: Shows when a level is being loaded
- **Information Panel**: Displays current level, iterations, and scale constraints
- **Button States**: Active level is highlighted in gold, disabled during loading

### How It Works
1. **Button Click**: User clicks a level button
2. **Scene Removal**: Current 3D scene is removed from memory
3. **New Scene Loading**: New KSPLAT file is loaded
4. **UI Update**: Buttons and information are updated
5. **Visual Feedback**: Loading indicator shows progress

## 🔍 Technical Details

### Python Script Functions

#### `apply_scale_constraints(vertices, level)`
- **Purpose**: Modifies scale properties of 3D objects
- **Input**: Vertex data and LOD level
- **Output**: Modified vertex data with new scale values
- **How**: Multiplies `scale_0`, `scale_1`, `scale_2` properties by scale factor

#### `convert_ply_to_ksplat(input_ply, output_ksplat, level)`
- **Purpose**: Main conversion function
- **Steps**:
  1. Read PLY file
  2. Apply scale constraints (if levels 1-4)
  3. Create temporary modified PLY
  4. Call JavaScript KSPLAT converter
  5. Clean up temporary files

#### `convert_all_levels(scene_dir)`
- **Purpose**: Batch process all levels for a scene
- **Automation**: Finds all PLY files and converts them automatically

### JavaScript Integration

#### Level Configuration
```javascript
const levelConfig = {
  1: { iterations: '10k', scale: '70% reduction', path: '...' },
  2: { iterations: '15k', scale: '50% reduction', path: '...' },
  // ... more levels
};
```

#### Scene Management
```javascript
// Remove current scene
if (currentScene) {
  viewer.removeSplatScene(currentScene);
  currentScene = null;
}

// Load new scene
currentScene = await viewer.addSplatScene(path, {
  'progressiveLoad': false
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Python Dependencies Not Found
```bash
# Install dependencies
pip3 install numpy plyfile

# Or use requirements.txt
pip3 install -r requirements.txt
```

#### 2. KSPLAT Conversion Fails
- Check if Node.js is installed
- Verify the `util/create-ksplat.js` script exists
- Ensure input PLY files are valid

#### 3. Level Switching Not Working
- Check browser console for JavaScript errors
- Verify KSPLAT files exist in the correct paths
- Ensure file permissions allow reading the files

#### 4. Scale Constraints Not Visible
- Scale differences are subtle - look carefully at object sizes
- Level 1 should have noticeably smaller objects
- Level 5 should have original-sized objects

### Debug Mode
Add `?mode=1` to the URL to force KSPLAT mode:
```
demo/kitchen.html?mode=1
demo/58e7.html?mode=1
```

## 📝 File Formats

### Input: PLY Files
- **Format**: Stanford PLY format
- **Properties**: Position (x,y,z), color, scale, rotation, opacity
- **Size**: Varies by level (10k-30k iterations)

### Output: KSPLAT Files
- **Format**: Custom KSPLAT format for efficient rendering
- **Optimization**: Spatial organization and compression
- **Compatibility**: Works with the existing 3D viewer

## 🔄 Workflow Summary

1. **Prepare**: Install Python dependencies
2. **Convert**: Run conversion script to create KSPLAT files
3. **Test**: Open HTML files and test level switching
4. **Customize**: Modify scale factors if needed
5. **Deploy**: Use in your 3D visualization system

## 📚 Learning Resources

- **PLY Format**: [Stanford PLY Format](http://paulbourke.net/dataformats/ply/)
- **3D Gaussian Splats**: [Gaussian Splats 3D](https://github.com/mkkellogg/GaussianSplats3D)
- **Python File Handling**: [Python File Operations](https://docs.python.org/3/tutorial/inputoutput.html)

## 🤝 Contributing

To modify the system:
1. **Scale Factors**: Edit the `scale_factors` dictionary in the Python script
2. **UI Styling**: Modify CSS in the HTML files
3. **Level Configuration**: Update the `levelConfig` object in JavaScript
4. **File Paths**: Adjust paths in both Python and JavaScript code

## 📄 License

This system is part of the FLOD 3DGS Demo project. See the main LICENSE file for details.
