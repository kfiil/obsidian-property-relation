# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is the **Obsidian Property Relation** plugin, designed to implement bidirectional property relationships similar to Notion's Relation database type. When a note references another note through a designated property, the plugin automatically creates the reverse relationship in the target note.

### Core Functionality
- **Bidirectional Properties**: Configure properties (e.g., "related", "mentions", "links-to") that automatically sync between notes
- **Automatic Synchronization**: When Note A adds Note B to a bidirectional property, Note B automatically gets Note A added to its corresponding property
- **Real-time Updates**: Changes are applied immediately when properties are modified
- **Configurable Properties**: Users can define which properties should be bidirectional through settings

## Development Commands

### Build and Development
- `npm run dev` - Start development with watch mode compilation
- `npm run build` - Build for production (includes TypeScript check)
- `npm i` - Install dependencies

### Version Management
- `npm run version` - Bump version and update manifest.json and versions.json

## Project Architecture

This is an Obsidian plugin built with TypeScript and bundled using esbuild, designed to handle bidirectional property relationships between notes.

### Core Components

#### Property Management System
- **PropertyDetector**: Identifies bidirectional properties in frontmatter
- **PropertyParser**: Extracts note references from property values (handles `[[Note Name]]` wikilink format)
- **PropertyValidator**: Ensures property configurations are valid

#### Synchronization Engine
- **BiDirectionalSync**: Core logic for maintaining bidirectional relationships
- **PropertyUpdater**: Safely updates frontmatter properties in notes
- **ConflictResolver**: Handles edge cases like circular references and deletion

#### Configuration System
- **SettingsInterface**: UI for configuring which properties are bidirectional
- **PropertyRegistry**: Maintains list of active bidirectional properties
- **SettingsStorage**: Persistent storage of plugin configuration

#### File System Integration
- **FileWatcher**: Monitors note changes for property modifications
- **MetadataListener**: Hooks into Obsidian's metadata cache events
- **BatchProcessor**: Handles bulk operations efficiently

### Build System
- **esbuild**: Modern bundler for development and production builds
- **TypeScript**: Primary development language with strict typing
- **ESLint**: Code quality and linting

### Dependencies
- **Obsidian API**: Core platform for plugin development, specifically:
  - `MetadataCache` for property detection
  - `Vault` for file operations
  - `PluginSettingTab` for configuration UI
- **TypeScript**: 4.7.4 with Node types
- **ESLint**: TypeScript-specific linting configuration

## Current State

The project currently contains:
- `package.json` - Project configuration and build scripts
- `LICENSE` - BSD 3-Clause license
- `CLAUDE.md` - This developer guidance file

## Implementation Details

### Property Detection Logic
Properties are identified as bidirectional through:
1. User configuration in settings (e.g., "related", "mentions", "connected-to")
2. Frontmatter parsing using regex patterns to extract `[[Note Name]]` wikilink references

### Synchronization Workflow
1. **Detection**: FileWatcher detects property changes in frontmatter
2. **Parsing**: PropertyParser extracts note references from modified properties
3. **Validation**: Ensure target notes exist and properties are configured as bidirectional
4. **Update**: PropertyUpdater modifies target note's frontmatter to add reverse relationship
5. **Conflict Resolution**: Handle cases where relationships already exist or create cycles

### Example Use Case
```yaml
# Note A: "Project Alpha"
---
related: "[[Project Beta]]"
---

# Note B: "Project Beta" (automatically updated)
---
related: "[[Project Alpha]]"
---
```

### Error Handling
- **Missing Files**: Skip updates for non-existent target notes
- **Circular References**: Detect and prevent infinite update loops
- **Property Conflicts**: Merge with existing property values
- **Permission Issues**: Handle read-only files gracefully

## Next Development Steps

Core files needed for implementation:
1. `main.ts` - Main plugin entry point with PropertyRelationPlugin class
2. `manifest.json` - Plugin metadata and configuration
3. `esbuild.config.mjs` - Build configuration
4. `tsconfig.json` - TypeScript configuration
5. `src/property-detector.ts` - Property identification logic
6. `src/bidirectional-sync.ts` - Core synchronization engine
7. `src/settings.ts` - Configuration management
8. `src/types.ts` - TypeScript interfaces and types

## Standard Obsidian Plugin Structure

The plugin follows Obsidian's architecture:
- Main class extends `Plugin` with lifecycle methods
- Settings extend `PluginSettingTab` for configuration UI
- Event listeners for `metadata-cache-changed` and `file-modified`
- Uses Obsidian's `MetadataCache` API for frontmatter access
- Implements proper cleanup in `onunload()` to prevent memory leaks