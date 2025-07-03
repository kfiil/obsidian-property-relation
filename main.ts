import { Plugin, TFile, MetadataCache, Vault, Notice } from 'obsidian';
import { PropertyPair, PropertyRelationSettings } from './src/types';
import { extractWikilinks } from './src/wikilink-extractor';
import { addBidirectionalReference, removeBidirectionalReference } from './src/frontmatter-modifier';

const DEFAULT_SETTINGS: PropertyRelationSettings = {
	propertyPairs: [
		{ propertyA: 'related', propertyB: 'related' },
		{ propertyA: 'wardrobe', propertyB: 'outfits' }
	]
};

export default class PropertyRelationPlugin extends Plugin {
	settings: PropertyRelationSettings;
	private processingFiles = new Set<string>();
	private previousStates = new Map<string, Record<string, any>>();

	async onload() {
		await this.loadSettings();

		// Initialize previous states for all existing files
		const markdownFiles = this.app.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (metadata?.frontmatter) {
				this.previousStates.set(file.path, { ...metadata.frontmatter });
			}
		}

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
		const filePath = sourceFile.path;
		const previousState = this.previousStates.get(filePath) || {};

		// Check each configured property pair
		for (const pair of this.settings.propertyPairs) {
			// Handle propertyA changes
			await this.handlePropertyChanges(
				sourceFile, 
				pair.propertyA, 
				pair.propertyB, 
				frontmatter[pair.propertyA], 
				previousState[pair.propertyA]
			);

			// Handle propertyB changes
			await this.handlePropertyChanges(
				sourceFile, 
				pair.propertyB, 
				pair.propertyA, 
				frontmatter[pair.propertyB], 
				previousState[pair.propertyB]
			);
		}

		// Store current state for next comparison
		this.previousStates.set(filePath, { ...frontmatter });
	}

	private async handlePropertyChanges(
		sourceFile: TFile,
		sourceProperty: string,
		targetProperty: string,
		currentValue: any,
		previousValue: any
	) {
		const currentLinks = extractWikilinks(currentValue);
		const previousLinks = extractWikilinks(previousValue);

		// Find added links
		const addedLinks = currentLinks.filter(link => !previousLinks.includes(link));
		for (const linkedNoteName of addedLinks) {
			await this.updateTargetNote(sourceFile, linkedNoteName, sourceProperty, targetProperty);
		}

		// Find removed links
		const removedLinks = previousLinks.filter(link => !currentLinks.includes(link));
		for (const linkedNoteName of removedLinks) {
			await this.removeFromTargetNote(sourceFile, linkedNoteName, sourceProperty, targetProperty);
		}
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
			const newContent = addBidirectionalReference(
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

	private async removeFromTargetNote(sourceFile: TFile, targetNoteName: string, sourceProperty: string, targetProperty: string) {
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
			return this.removeFromTargetNote(sourceFile, found.basename, sourceProperty, targetProperty);
		}

		// Prevent processing the same file to avoid loops
		if (this.processingFiles.has(targetFile.path)) {
			return;
		}

		try {
			this.processingFiles.add(targetFile.path);

			const content = await this.app.vault.read(targetFile);
			console.log(`[PropertyRelation] Removing "${sourceFile.basename}" from "${targetProperty}" in ${targetFile.path}`);
			
			const newContent = removeBidirectionalReference(
				content,
				sourceFile.basename,
				targetProperty
			);

			if (newContent !== content) {
				console.log(`[PropertyRelation] Content changed, updating ${targetFile.path}`);
				await this.app.vault.modify(targetFile, newContent);
			} else {
				console.log(`[PropertyRelation] No changes needed for ${targetFile.path}`);
			}
		} catch (error) {
			console.error(`[PropertyRelation] Error in removeFromTargetNote:`, error);
			console.error(`[PropertyRelation] - sourceFile: ${sourceFile.path}`);
			console.error(`[PropertyRelation] - targetFile: ${targetFile.path}`);
			console.error(`[PropertyRelation] - sourceProperty: ${targetProperty}`);
			new Notice(`Error removing property relation: ${error.message}`);
		} finally {
			this.processingFiles.delete(targetFile.path);
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