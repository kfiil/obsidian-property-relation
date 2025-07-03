import { Plugin, TFile, MetadataCache, Vault, Notice } from 'obsidian';

interface PropertyPair {
	propertyA: string;
	propertyB: string;
}

interface PropertyRelationSettings {
	propertyPairs: PropertyPair[];
}

const DEFAULT_SETTINGS: PropertyRelationSettings = {
	propertyPairs: [
		{ propertyA: 'related', propertyB: 'related' },
		{ propertyA: 'wardrobe', propertyB: 'outfits' }
	]
};

export default class PropertyRelationPlugin extends Plugin {
	settings: PropertyRelationSettings;
	private processingFiles = new Set<string>();

	async onload() {
		await this.loadSettings();

		// Register event listeners for file changes
		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.handleFileChange(file);
				}
			})
		);

		// Add settings tab
		this.addSettingTab(new PropertyRelationSettingTab(this.app, this));

		console.log('Property Relation plugin loaded');
	}

	onunload() {
		console.log('Property Relation plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleFileChange(file: TFile) {
		// Prevent infinite loops by tracking files being processed
		if (this.processingFiles.has(file.path)) {
			return;
		}

		try {
			this.processingFiles.add(file.path);
			await this.syncBidirectionalProperties(file);
		} catch (error) {
			console.error('Error handling file change:', error);
			new Notice(`Error syncing properties in ${file.name}: ${error.message}`);
		} finally {
			this.processingFiles.delete(file.path);
		}
	}

	private async syncBidirectionalProperties(sourceFile: TFile) {
		const metadata = this.app.metadataCache.getFileCache(sourceFile);
		if (!metadata?.frontmatter) return;

		const frontmatter = metadata.frontmatter;

		// Check each configured property pair
		for (const pair of this.settings.propertyPairs) {
			// Check if this file has propertyA and sync to propertyB
			const propertyAValue = frontmatter[pair.propertyA];
			if (propertyAValue) {
				const linkedNotes = this.extractWikilinks(propertyAValue);
				for (const linkedNoteName of linkedNotes) {
					await this.updateTargetNote(sourceFile, linkedNoteName, pair.propertyA, pair.propertyB);
				}
			}

			// Check if this file has propertyB and sync to propertyA
			const propertyBValue = frontmatter[pair.propertyB];
			if (propertyBValue) {
				const linkedNotes = this.extractWikilinks(propertyBValue);
				for (const linkedNoteName of linkedNotes) {
					await this.updateTargetNote(sourceFile, linkedNoteName, pair.propertyB, pair.propertyA);
				}
			}
		}
	}

	private extractWikilinks(value: any): string[] {
		if (!value) return [];

		// Handle both string and array values
		const values = Array.isArray(value) ? value : [value];
		const wikilinks: string[] = [];

		for (const val of values) {
			if (typeof val === 'string') {
				// Extract note names from [[Note Name]] format
				const matches = val.match(/\[\[([^\]]+)\]\]/g);
				if (matches) {
					for (const match of matches) {
						const noteName = match.slice(2, -2); // Remove [[ and ]]
						wikilinks.push(noteName);
					}
				}
			}
		}

		return wikilinks;
	}

	private async updateTargetNote(sourceFile: TFile, targetNoteName: string, sourceProperty: string, targetProperty: string) {
		// Find the target file
		const targetFile = this.app.vault.getAbstractFileByPath(`${targetNoteName}.md`);
		if (!(targetFile instanceof TFile)) {
			// Try finding by name if direct path doesn't work
			const files = this.app.vault.getMarkdownFiles();
			const found = files.find(f => f.basename === targetNoteName);
			if (!found) {
				console.log(`Target note not found: ${targetNoteName}`);
				return;
			}
			return this.updateTargetNote(sourceFile, found.basename, sourceProperty, targetProperty);
		}

		// Prevent processing the same file to avoid loops
		if (this.processingFiles.has(targetFile.path)) {
			return;
		}

		try {
			this.processingFiles.add(targetFile.path);

			const content = await this.app.vault.read(targetFile);
			const newContent = await this.addBidirectionalReference(
				content,
				sourceFile.basename,
				targetProperty
			);

			if (newContent !== content) {
				await this.app.vault.modify(targetFile, newContent);
			}
		} finally {
			this.processingFiles.delete(targetFile.path);
		}
	}

	private async addBidirectionalReference(
		content: string,
		sourceNoteName: string,
		propertyName: string
	): Promise<string> {
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
		const match = content.match(frontmatterRegex);

		const sourceReference = `[[${sourceNoteName}]]`;

		if (match) {
			// Parse existing frontmatter
			const frontmatterContent = match[1];
			const lines = frontmatterContent.split('\n');
			const newLines: string[] = [];
			let propertyFound = false;

			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed.startsWith(`${propertyName}:`)) {
					propertyFound = true;
					const existingValue = trimmed.substring(`${propertyName}:`.length).trim();
					
					if (existingValue) {
						// Check if reference already exists
						if (!existingValue.includes(sourceReference)) {
							// Add to existing value
							if (existingValue.startsWith('[') && existingValue.endsWith(']')) {
								// Array format - parse existing array properly
								const arrayContent = existingValue.slice(1, -1).trim();
								if (arrayContent) {
									// Non-empty array, add with comma
									const newValue = `[${arrayContent}, "${sourceReference}"]`;
									newLines.push(`${propertyName}: ${newValue}`);
								} else {
									// Empty array
									const newValue = `["${sourceReference}"]`;
									newLines.push(`${propertyName}: ${newValue}`);
								}
							} else {
								// Convert single value to array format
								newLines.push(`${propertyName}: ["${existingValue}", "${sourceReference}"]`);
							}
						} else {
							newLines.push(line);
						}
					} else {
						// Empty property, add reference
						newLines.push(`${propertyName}: "${sourceReference}"`);
					}
				} else {
					newLines.push(line);
				}
			}

			// Add property if not found
			if (!propertyFound) {
				newLines.push(`${propertyName}: "${sourceReference}"`);
			}

			const newFrontmatter = newLines.join('\n');
			return content.replace(frontmatterRegex, `---\n${newFrontmatter}\n---\n`);
		} else {
			// No frontmatter exists, create it
			const newFrontmatter = `---\n${propertyName}: "${sourceReference}"\n---\n`;
			return newFrontmatter + content;
		}
	}
}

import { App, PluginSettingTab, Setting } from 'obsidian';

class PropertyRelationSettingTab extends PluginSettingTab {
	plugin: PropertyRelationPlugin;

	constructor(app: App, plugin: PropertyRelationPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Property Relation Settings' });

		containerEl.createEl('p', { 
			text: 'Configure property pairs for bidirectional synchronization. When Note A has Property A linking to Note B, Note B will automatically get Property B linking back to Note A.' 
		});

		// Display existing pairs
		this.plugin.settings.propertyPairs.forEach((pair, index) => {
			const pairContainer = containerEl.createDiv('property-pair-container');
			pairContainer.style.marginBottom = '15px';
			pairContainer.style.padding = '10px';
			pairContainer.style.border = '1px solid var(--background-modifier-border)';
			pairContainer.style.borderRadius = '5px';

			new Setting(pairContainer)
				.setName(`Property Pair ${index + 1}`)
				.setDesc('Two properties that will be synchronized bidirectionally')
				.addText(text => text
					.setPlaceholder('Property A')
					.setValue(pair.propertyA)
					.onChange(async (value) => {
						this.plugin.settings.propertyPairs[index].propertyA = value.trim();
						await this.plugin.saveSettings();
					}))
				.addText(text => text
					.setPlaceholder('Property B')
					.setValue(pair.propertyB)
					.onChange(async (value) => {
						this.plugin.settings.propertyPairs[index].propertyB = value.trim();
						await this.plugin.saveSettings();
					}))
				.addButton(button => button
					.setButtonText('Remove')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.propertyPairs.splice(index, 1);
						await this.plugin.saveSettings();
						this.display(); // Refresh the display
					}));
		});

		// Add new pair button
		new Setting(containerEl)
			.setName('Add Property Pair')
			.setDesc('Add a new bidirectional property pair')
			.addButton(button => button
				.setButtonText('Add Pair')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.propertyPairs.push({ propertyA: '', propertyB: '' });
					await this.plugin.saveSettings();
					this.display(); // Refresh the display
				}));

		// Examples section
		const examplesEl = containerEl.createDiv();
		examplesEl.style.marginTop = '20px';
		examplesEl.createEl('h3', { text: 'Examples' });
		examplesEl.createEl('p', { text: '• wardrobe ↔ outfits: Notes with wardrobe property link to notes with outfits property' });
		examplesEl.createEl('p', { text: '• related ↔ related: Traditional bidirectional linking with same property name' });
		examplesEl.createEl('p', { text: '• project ↔ tasks: Project notes link to task notes and vice versa' });
	}
}