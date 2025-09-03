import * as GaussianSplats3D from '../build/gaussian-splats-3d.module.js';
import * as THREE from '../build/demo/lib/three.module.js';
import { FLoDPlyParser } from '../src/loaders/ply/FLoDPlyParser.js';
import * as fs from 'fs';

if (process.argv.length < 5) {
    console.log('Expected at least 4 arguments!');
    console.log('Usage: node create-ksplat-flod.js [path to .PLY] [output file name] [LOD level (1-4)] [compression level = 0] [alpha removal threshold = 1] [scene center = "0,0,0"] [block size = 5.0] [bucket size = 256] [spherical harmonics level = 0]');
    process.exit(1);
}

const intputFile = process.argv[2];
const outputFile = process.argv[3];
const lodLevel = parseInt(process.argv[4]);
const compressionLevel = (process.argv.length >= 6) ? parseInt(process.argv[5]) : undefined;
const splatAlphaRemovalThreshold = (process.argv.length >= 7) ? parseInt(process.argv[6]) : undefined;
const sceneCenter = (process.argv.length >= 8) ? new THREE.Vector3().fromArray(process.argv[7].split(',')) : undefined;
const blockSize = (process.argv.length >= 9) ? parseFloat(process.argv[8]) : undefined;
const bucketSize = (process.argv.length >= 10) ? parseInt(process.argv[9]) : undefined;
const outSphericalHarmonicsDegree = (process.argv.length >= 11) ? parseInt(process.argv[10]) : undefined;
const sectionSize = 0;

// Validate LOD level
if (lodLevel < 1 || lodLevel > 4) {
    console.log('Error: LOD level must be between 1 and 4');
    process.exit(1);
}

const fileData = fs.readFileSync(intputFile);
const path = intputFile.toLowerCase().trim();

// Check if input file is a PLY file
if (!path.endsWith('.ply')) {
    console.log('Error: Input file must be a .PLY file');
    process.exit(1);
}

const splatBuffer = fileBufferToSplatBuffer(fileData.buffer, compressionLevel, splatAlphaRemovalThreshold, lodLevel);

fs.writeFileSync(outputFile, Buffer.from(splatBuffer.bufferData));

function fileBufferToSplatBuffer(fileBufferData, compressionLevel, alphaRemovalThreshold, lodLevel) {
    let splatBuffer;
    
    // Parse PLY file to uncompressed splat array (force FLoDPlyParser, apply FLOD scale inside)
    let splatArray = FLoDPlyParser.parseToUncompressedSplatArray(fileBufferData, outSphericalHarmonicsDegree, lodLevel);
    
    // FLOD scaling applied inside FLoDPlyParser; keep here as no-op placeholder if needed
    
    // Generate K-Splat buffer
    const splatBufferGenerator = GaussianSplats3D.SplatBufferGenerator.getStandardGenerator(alphaRemovalThreshold, compressionLevel,
                                                                                            sectionSize, sceneCenter, blockSize,
                                                                                            bucketSize);
    splatBuffer = splatBufferGenerator.generateFromUncompressedSplatArray(splatArray);

    return splatBuffer;
}
