const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const RELEASE_DIR = 'obsidian-property-relation';
const REQUIRED_FILES = ['main.js', 'manifest.json', 'styles.css'];

console.log('🚀 Building release for Obsidian Property Relation plugin...');

// Clean and create release directory
if (fs.existsSync(RELEASE_DIR)) {
    fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
    console.log('✅ Cleaned existing release directory');
}
fs.mkdirSync(RELEASE_DIR, { recursive: true });
console.log(`✅ Created release directory: ${RELEASE_DIR}`);

// Build the plugin
try {
    console.log('📦 Building plugin...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Plugin built successfully');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Copy required files
console.log('📁 Copying plugin files...');

// Copy main.js
if (fs.existsSync('main.js')) {
    fs.copyFileSync('main.js', path.join(RELEASE_DIR, 'main.js'));
    console.log('✅ Copied main.js');
} else {
    console.error('❌ main.js not found - build may have failed');
    process.exit(1);
}

// Copy manifest.json
if (fs.existsSync('manifest.json')) {
    fs.copyFileSync('manifest.json', path.join(RELEASE_DIR, 'manifest.json'));
    console.log('✅ Copied manifest.json');
} else {
    console.error('❌ manifest.json not found');
    process.exit(1);
}

// Copy styles.css if it exists
if (fs.existsSync('styles.css')) {
    fs.copyFileSync('styles.css', path.join(RELEASE_DIR, 'styles.css'));
    console.log('✅ Copied styles.css');
} else {
    console.log('ℹ️  No styles.css found (optional)');
}

// Copy versions.json if it exists
if (fs.existsSync('versions.json')) {
    fs.copyFileSync('versions.json', path.join(RELEASE_DIR, 'versions.json'));
    console.log('✅ Copied versions.json');
} else {
    console.log('ℹ️  No versions.json found (optional)');
}

// Copy README.md if it exists
if (fs.existsSync('README.md')) {
    fs.copyFileSync('README.md', path.join(RELEASE_DIR, 'README.md'));
    console.log('✅ Copied README.md');
}

// Copy LICENSE if it exists
if (fs.existsSync('LICENSE')) {
    fs.copyFileSync('LICENSE', path.join(RELEASE_DIR, 'LICENSE'));
    console.log('✅ Copied LICENSE');
}

// Verify the release
console.log('\n🔍 Verifying release build...');
const releaseFiles = fs.readdirSync(RELEASE_DIR);
console.log('📋 Release contains:', releaseFiles.join(', '));

// Check required files
const missingFiles = REQUIRED_FILES.filter(file => 
    file === 'styles.css' ? true : !releaseFiles.includes(file)
);

if (missingFiles.length > 0 && missingFiles.some(f => f !== 'styles.css')) {
    console.error('❌ Missing required files:', missingFiles.join(', '));
    process.exit(1);
}

// Read and display manifest info
try {
    const manifest = JSON.parse(fs.readFileSync(path.join(RELEASE_DIR, 'manifest.json'), 'utf8'));
    console.log('\n📄 Plugin Information:');
    console.log(`   Name: ${manifest.name}`);
    console.log(`   ID: ${manifest.id}`);
    console.log(`   Version: ${manifest.version}`);
    console.log(`   Author: ${manifest.author}`);
    console.log(`   Description: ${manifest.description}`);
    console.log(`   Min App Version: ${manifest.minAppVersion}`);
} catch (error) {
    console.warn('⚠️  Could not read manifest.json for verification');
}

// Calculate file sizes
console.log('\n📊 File Sizes:');
releaseFiles.forEach(file => {
    const filePath = path.join(RELEASE_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   ${file}: ${sizeKB} KB`);
});

console.log('\n🎉 Release build completed successfully!');
console.log(`📦 Release available in: ${RELEASE_DIR}/`);
console.log('\n📋 Installation Instructions:');
console.log('1. Copy the entire "obsidian-property-relation" folder to your vault\'s .obsidian/plugins/ directory');
console.log('2. Restart Obsidian');
console.log('3. Go to Settings → Community Plugins and enable "Property Relation"');
console.log('\n✨ Ready for distribution!');