import { extractWikilinks } from './wikilink-extractor';

export const addBidirectionalReference = (
	content: string,
	sourceNoteName: string,
	propertyName: string
): string => {
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
					// Parse existing values to check for duplicates
					const existingLinks = extractWikilinks(existingValue);
					const sourceNoteNameFromRef = sourceReference.slice(2, -2); // Remove [[ and ]]
					
					// Check if reference already exists
					if (!existingLinks.includes(sourceNoteNameFromRef)) {
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
							newLines.push(`${propertyName}: [${existingValue}, "${sourceReference}"]`);
						}
					} else {
						// Reference already exists, keep existing line unchanged
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
		// Check if content starts with empty frontmatter (---)
		if (content.trim().startsWith('---\n---')) {
			// Replace empty frontmatter with new property
			return content.replace(/^---\s*\n---\s*\n/, `---\n${propertyName}: "${sourceReference}"\n---\n`);
		} else {
			// No frontmatter exists, create it
			const newFrontmatter = `---\n${propertyName}: "${sourceReference}"\n---\n`;
			return newFrontmatter + content;
		}
	}
};

export const removeBidirectionalReference = (
	content: string,
	sourceNoteName: string,
	propertyName: string
): string => {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
	const match = content.match(frontmatterRegex);

	const sourceReference = `[[${sourceNoteName}]]`;

	if (match) {
		// Parse existing frontmatter
		const frontmatterContent = match[1];
		const lines = frontmatterContent.split('\n');
		const newLines: string[] = [];
		let propertyModified = false;

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith(`${propertyName}:`)) {
				const existingValue = trimmed.substring(`${propertyName}:`.length).trim();
				
				if (existingValue) {
					if (existingValue.includes(sourceReference)) {
						propertyModified = true;
						
						// Check if it's a proper YAML array (starts with [ and ends with ] but not a wikilink)
						if (existingValue.startsWith('[') && existingValue.endsWith(']') && !existingValue.startsWith('[[')) {
							// Array format - remove the specific reference
							const arrayContent = existingValue.slice(1, -1);
							const items = arrayContent.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
							const filteredItems = items.filter(item => item !== sourceReference);
							
							if (filteredItems.length === 0) {
								// Don't add the property line at all if array becomes empty
								continue;
							} else if (filteredItems.length === 1) {
								// Convert back to single value if only one item remains
								newLines.push(`${propertyName}: "${filteredItems[0]}"`);
							} else {
								// Keep as array with remaining items
								const newArrayValue = `[${filteredItems.map(item => `"${item}"`).join(', ')}]`;
								newLines.push(`${propertyName}: ${newArrayValue}`);
							}
						} else if (existingValue === `"${sourceReference}"` || existingValue === sourceReference) {
							// Single value that matches exactly - remove property entirely
							continue;
						} else {
							// Single value that doesn't match - keep as is
							newLines.push(line);
						}
					} else {
						// Value doesn't contain the reference - keep as is
						newLines.push(line);
					}
				} else {
					// Empty property - keep as is
					newLines.push(line);
				}
			} else {
				newLines.push(line);
			}
		}

		if (propertyModified) {
			const newFrontmatter = newLines.join('\n');
			// If frontmatter is empty after removal, keep empty frontmatter block
			if (newFrontmatter.trim() === '') {
				return content.replace(frontmatterRegex, `---\n---\n`);
			}
			return content.replace(frontmatterRegex, `---\n${newFrontmatter}\n---\n`);
		}
	}

	return content;
};