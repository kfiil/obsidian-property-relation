import { extractWikilinks } from './wikilink-extractor';
import { preprocessYamlBlockArrays } from './yaml-preprocessor';

export const addBidirectionalReference = (
	content: string,
	sourceNoteName: string,
	propertyName: string
): string => {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
	const match = content.match(frontmatterRegex);

	const sourceReference = `[[${sourceNoteName}]]`;

	if (match) {
		// Parse existing frontmatter - preprocess to handle block arrays
		const frontmatterContent = preprocessYamlBlockArrays(match[1]);
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
	try {
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
		const match = content.match(frontmatterRegex);

	const sourceReference = `[[${sourceNoteName}]]`;

	if (match) {
		// Parse existing frontmatter - preprocess to handle block arrays
		const frontmatterContent = preprocessYamlBlockArrays(match[1]);
		const lines = frontmatterContent.split('\n');
		const newLines: string[] = [];
		let propertyModified = false;

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith(`${propertyName}:`)) {
				const existingValue = trimmed.substring(`${propertyName}:`.length).trim();
				
				if (existingValue) {
					// Check if value contains the reference (including partial matches for malformed YAML)
					const sourceNoteNameFromRef = sourceReference.slice(2, -2); // Remove [[ and ]]
					if (existingValue.includes(sourceReference) || existingValue.includes(sourceNoteNameFromRef)) {
						propertyModified = true;
						
						// Check if it's a proper YAML array (starts with [ and ends with ] but not a wikilink)
						if (existingValue.startsWith('[') && existingValue.endsWith(']') && !existingValue.startsWith('[[')) {
							// Array format - remove the specific reference
							const arrayContent = existingValue.slice(1, -1);
							const items = arrayContent.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
							
							// Filter out items that match the target reference (including partial matches for malformed YAML)
							const filteredItems = items.filter(item => {
								// Exact match
								if (item === sourceReference) return false;
								
								// Check if this item contains the source note name (for malformed wikilinks)
								if (item.includes(sourceNoteNameFromRef)) {
									return false;
								}
								
								return true;
							});
							
							// Clean up any remaining items to fix broken wikilinks
							const cleanedItems = filteredItems
								.map(item => {
									let cleanItem = item;
									
									// Remove any extraneous quotes that might be stuck to the content
									cleanItem = cleanItem.replace(/^"+|"+$/g, ''); // Remove leading/trailing quotes
									
									// Fix broken wikilinks - if item looks like a partial wikilink, try to repair it
									if (cleanItem.includes('[[') && !cleanItem.includes(']]')) {
										// Missing closing ]]
										cleanItem = cleanItem + ']]';
									} else if (cleanItem.includes(']]') && !cleanItem.includes('[[')) {
										// Missing opening [[
										cleanItem = '[[' + cleanItem;
									}
									
									return cleanItem;
								})
								.filter(item => item.trim() !== '' && item !== '""' && item !== '"'); // Remove empty or quote-only items

							if (cleanedItems.length === 0) {
								// Property becomes empty - remove it entirely (don't add it to newLines)
								// This maintains backward compatibility with existing behavior
							} else if (cleanedItems.length === 1) {
								// Convert back to single value if only one item remains
								newLines.push(`${propertyName}: "${cleanedItems[0]}"`);
							} else {
								// Keep as array with remaining items
								const newArrayValue = `[${cleanedItems.map(item => `"${item}"`).join(', ')}]`;
								newLines.push(`${propertyName}: ${newArrayValue}`);
							}
						} else if (existingValue === `"${sourceReference}"` || existingValue === sourceReference) {
							// Single value that matches exactly - remove property entirely
							// (don't add it to newLines)
						} else {
							// Handle malformed YAML or mixed content - remove all instances of the wikilink
							let newValue = existingValue;
							
							// Remove complete wikilinks (with and without quotes)
							newValue = newValue.replace(new RegExp(`"?\\[\\[${sourceNoteName}\\]\\]"?`, 'g'), '');
							
							// Remove partial/broken wikilinks that might exist in malformed YAML
							// This handles cases like: ""[[Note Name", "Other]]""
							newValue = newValue.replace(new RegExp(`"?\\[\\[${sourceNoteName}"?`, 'g'), '');
							newValue = newValue.replace(new RegExp(`"?${sourceNoteName}\\]\\]"?`, 'g'), '');
							
							// Clean up malformed array syntax
							newValue = newValue
								.replace(/\[\s*""\s*/g, '[')     // Remove leading double quotes in arrays
								.replace(/\s*""\s*\]/g, ']')     // Remove trailing double quotes in arrays
								.replace(/,\s*,/g, ',')          // Remove duplicate commas
								.replace(/^\[,|,\]$/g, match => match.replace(',', ''))  // Remove leading/trailing commas
								.replace(/\s+/g, ' ')            // Replace multiple spaces with single space
								.replace(/^\s+|\s+$/g, '')       // Trim leading/trailing spaces
								.replace(/^-\s*|-\s*$/g, '')     // Remove leading/trailing dashes
								.replace(/\s*-\s*-\s*/g, ' ')    // Replace dash sequences with spaces
								.replace(/^\s+|\s+$/g, '');      // Trim again
							
							// If the value becomes empty or contains only quotes/punctuation, remove property
							if (!newValue || newValue.match(/^["'\s\-\[\],]*$/)) {
								// Property becomes empty - remove it entirely (don't add to newLines)
							} else {
								// Try to fix remaining array structure if it looks like an array
								if (newValue.startsWith('[') && newValue.endsWith(']')) {
									const arrayContent = newValue.slice(1, -1).trim();
									if (arrayContent) {
										// Split by comma and clean up items
										const items = arrayContent.split(',')
											.map(item => item.trim())
											.filter(item => item && item !== '""' && item !== '"')
											.map(item => item.replace(/^"(.+)"$/, '$1')); // Remove quotes if they wrap the whole item
										
										if (items.length === 0) {
											// Array becomes empty - remove property entirely
										} else if (items.length === 1) {
											newLines.push(`${propertyName}: "${items[0]}"`);
										} else {
											const cleanArray = `[${items.map(item => `"${item}"`).join(', ')}]`;
											newLines.push(`${propertyName}: ${cleanArray}`);
										}
									} else {
										// Array content is empty - remove property entirely
									}
								} else {
									// Keep the modified value as-is
									newLines.push(`${propertyName}: ${newValue}`);
								}
							}
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
	} catch (error) {
		console.error('[PropertyRelation] Error in removeBidirectionalReference:', error);
		console.error('[PropertyRelation] Content:', content);
		console.error('[PropertyRelation] sourceNoteName:', sourceNoteName);
		console.error('[PropertyRelation] propertyName:', propertyName);
		// Return original content to prevent data loss
		return content;
	}
};