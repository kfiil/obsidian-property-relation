/**
 * Preprocesses YAML content to convert block arrays to inline arrays
 * This helps ensure consistent parsing in the frontmatter modifier
 */
export const preprocessYamlBlockArrays = (frontmatterContent: string): string => {
	const lines = frontmatterContent.split('\n');
	const newLines: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();
		
		// Check if this line is a property with no value (ends with :)
		const propertyMatch = trimmed.match(/^([^:]+):\s*$/);
		
		if (propertyMatch && i + 1 < lines.length) {
			const propertyName = propertyMatch[1];
			const blockArrayItems: string[] = [];
			let j = i + 1;
			
			// Collect all consecutive array items
			while (j < lines.length && lines[j].trim().startsWith('- ')) {
				const arrayItem = lines[j].trim().substring(2).trim(); // Remove "- "
				blockArrayItems.push(arrayItem);
				j++;
			}
			
			if (blockArrayItems.length > 0) {
				// Convert to inline array format
				const inlineArray = `[${blockArrayItems.join(', ')}]`;
				newLines.push(`${propertyName}: ${inlineArray}`);
				// Skip the array item lines since we've processed them
				i = j;
			} else {
				// Not a block array, keep the original line
				newLines.push(line);
				i++;
			}
		} else {
			// Regular line, keep as is
			newLines.push(line);
			i++;
		}
	}
	
	return newLines.join('\n');
};