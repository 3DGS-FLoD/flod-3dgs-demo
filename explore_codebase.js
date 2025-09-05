#!/usr/bin/env node

/**
 * Interactive Codebase Explorer for 3D Gaussian Splatting Library
 * 
 * This script helps you explore the codebase by providing:
 * - Function call relationships
 * - Import/export dependencies
 * - Class hierarchies
 * - Key entry points
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodebaseExplorer {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.srcPath = path.join(rootPath, 'src');
        this.imports = new Map();
        this.exports = new Map();
        this.classes = new Map();
        this.functions = new Map();
    }

    // Scan all JavaScript files and extract relationships
    scanCodebase() {
        console.log('🔍 Scanning codebase...');
        this.scanDirectory(this.srcPath);
        console.log(`✅ Found ${this.classes.size} classes, ${this.functions.size} functions`);
    }

    scanDirectory(dirPath) {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.scanDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                this.scanFile(fullPath);
            }
        }
    }

    scanFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(this.srcPath, filePath);
        
        // Extract imports
        const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
            const imports = importMatches.map(match => {
                const fromMatch = match.match(/from\s+['"]([^'"]+)['"]/);
                return fromMatch ? fromMatch[1] : null;
            }).filter(Boolean);
            this.imports.set(relativePath, imports);
        }

        // Extract exports
        const exportMatches = content.match(/export\s+(?:class|function|const|let|var)\s+(\w+)/g);
        if (exportMatches) {
            const exports = exportMatches.map(match => {
                const nameMatch = match.match(/export\s+(?:class|function|const|let|var)\s+(\w+)/);
                return nameMatch ? nameMatch[1] : null;
            }).filter(Boolean);
            this.exports.set(relativePath, exports);
        }

        // Extract classes
        const classMatches = content.match(/export\s+class\s+(\w+)/g);
        if (classMatches) {
            const classes = classMatches.map(match => {
                const nameMatch = match.match(/export\s+class\s+(\w+)/);
                return nameMatch ? nameMatch[1] : null;
            }).filter(Boolean);
            this.classes.set(relativePath, classes);
        }

        // Extract functions
        const functionMatches = content.match(/export\s+function\s+(\w+)/g);
        if (functionMatches) {
            const functions = functionMatches.map(match => {
                const nameMatch = match.match(/export\s+function\s+(\w+)/);
                return nameMatch ? nameMatch[1] : null;
            }).filter(Boolean);
            this.functions.set(relativePath, functions);
        }
    }

    // Find what imports a specific module
    findImporters(moduleName) {
        const importers = [];
        for (const [file, imports] of this.imports) {
            if (imports.some(imp => imp.includes(moduleName))) {
                importers.push(file);
            }
        }
        return importers;
    }

    // Find what a module imports
    findImports(fileName) {
        return this.imports.get(fileName) || [];
    }

    // Get all classes in a file
    getClasses(fileName) {
        return this.classes.get(fileName) || [];
    }

    // Get all functions in a file
    getFunctions(fileName) {
        return this.functions.get(fileName) || [];
    }

    // Generate dependency report
    generateReport() {
        console.log('\n📊 CODEBASE ANALYSIS REPORT');
        console.log('='.repeat(50));

        // Main entry points
        console.log('\n🚪 MAIN ENTRY POINTS:');
        console.log('• index.js - Main exports');
        console.log('• Viewer.js - Primary viewer class');
        console.log('• DropInViewer.js - Three.js integration');

        // Core components
        console.log('\n🏗️  CORE COMPONENTS:');
        const coreFiles = [
            'Viewer.js',
            'splatmesh/SplatMesh.js',
            'splatmesh/SplatScene.js',
            'loaders/ply/PlyLoader.js',
            'splattree/SplatTree.js',
            'worker/SortWorker.js'
        ];

        for (const file of coreFiles) {
            const classes = this.getClasses(file);
            const functions = this.getFunctions(file);
            console.log(`• ${file}:`);
            if (classes.length > 0) console.log(`  - Classes: ${classes.join(', ')}`);
            if (functions.length > 0) console.log(`  - Functions: ${functions.join(', ')}`);
        }

        // Most imported modules
        console.log('\n📦 MOST IMPORTED MODULES:');
        const importCounts = new Map();
        for (const imports of this.imports.values()) {
            for (const imp of imports) {
                const count = importCounts.get(imp) || 0;
                importCounts.set(imp, count + 1);
            }
        }
        
        const sortedImports = Array.from(importCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        for (const [module, count] of sortedImports) {
            console.log(`• ${module} (imported ${count} times)`);
        }

        // File structure
        console.log('\n📁 FILE STRUCTURE:');
        this.printFileStructure(this.srcPath, 0);
    }

    printFileStructure(dirPath, depth) {
        const items = fs.readdirSync(dirPath).sort();
        const indent = '  '.repeat(depth);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                console.log(`${indent}📁 ${item}/`);
                this.printFileStructure(fullPath, depth + 1);
            } else if (item.endsWith('.js')) {
                const relativePath = path.relative(this.srcPath, fullPath);
                const classes = this.getClasses(relativePath);
                const functions = this.getFunctions(relativePath);
                const exports = this.exports.get(relativePath) || [];
                
                let info = '';
                if (classes.length > 0) info += ` [${classes.join(', ')}]`;
                if (functions.length > 0) info += ` [${functions.join(', ')}]`;
                
                console.log(`${indent}📄 ${item}${info}`);
            }
        }
    }

    // Interactive exploration
    explore() {
        console.log('\n🔍 INTERACTIVE EXPLORATION');
        console.log('Available commands:');
        console.log('• imports <filename> - Show what a file imports');
        console.log('• importers <module> - Show what imports a module');
        console.log('• classes <filename> - Show classes in a file');
        console.log('• functions <filename> - Show functions in a file');
        console.log('• report - Generate full report');
        console.log('• quit - Exit');
        console.log('\nExample: imports Viewer.js');
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const rootPath = process.argv[2] || '.';
    const explorer = new CodebaseExplorer(rootPath);
    
    explorer.scanCodebase();
    explorer.generateReport();
    explorer.explore();
}

export default CodebaseExplorer;
