export const extractWikilinks = (value: any): string[] => {
	if (!value) return [];

	// Handle both string and array values
	const values = Array.isArray(value) ? value : [value];
	const wikilinks: string[] = [];

	for (const val of values) {
		if (typeof val === 'string') {
			// Extract note names from [[Note Name]] format
			// Use a more robust regex that can handle nested brackets and empty wikilinks
			const matches = val.match(/\[\[(.*?)\]\]/g);
			if (matches) {
				for (const match of matches) {
					const noteName = match.slice(2, -2); // Remove [[ and ]]
					wikilinks.push(noteName);
				}
			}
		}
	}

	return wikilinks;
};