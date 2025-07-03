import { Plugin, TFile, MetadataCache, Vault, Notice } from 'obsidian';

interface PropertyRelationSettings {
	bidirectionalProperties: string[];
}

const DEFAULT_SETTINGS: PropertyRelationSettings = {
	bidirectionalProperties: ['related', 'mentions', 'connected-to']
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

		// Check each configured bidirectional property
		for (const propertyName of this.settings.bidirectionalProperties) {
			const propertyValue = frontmatter[propertyName];
			if (!propertyValue) continue;

			// Extract note names from wikilinks
			const linkedNotes = this.extractWikilinks(propertyValue);

			// Update each linked note
			for (const linkedNoteName of linkedNotes) {
				await this.updateTargetNote(sourceFile, linkedNoteName, propertyName);
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

	private async updateTargetNote(sourceFile: TFile, targetNoteName: string, propertyName: string) {
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
			return this.updateTargetNote(sourceFile, found.basename, propertyName);
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
				propertyName
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
								// Array format
								const newValue = existingValue.slice(0, -1) + `, "${sourceReference}"]`;
								newLines.push(`${propertyName}: ${newValue}`);
							} else {
								// Convert to array format
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

		new Setting(containerEl)
			.setName('Bidirectional Properties')
			.setDesc('Comma-separated list of property names that should be bidirectional')
			.addTextArea(text => text
				.setPlaceholder('related, mentions, connected-to')
				.setValue(this.plugin.settings.bidirectionalProperties.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.bidirectionalProperties = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));
	}
}