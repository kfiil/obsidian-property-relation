describe('Debug frontmatter', () => {
	it('should test frontmatter regex', () => {
		const content = `---
Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]
---
Content`;

		console.log('Content:');
		console.log(JSON.stringify(content));
		
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
		const match = content.match(frontmatterRegex);
		
		console.log('Regex match:', !!match);
		if (match) {
			console.log('Matched frontmatter:', JSON.stringify(match[1]));
			
			// Test the lines parsing
			const lines = match[1].split('\n');
			console.log('Lines:', lines);
			
			// Test property matching
			for (const line of lines) {
				const trimmed = line.trim();
				console.log('Line:', JSON.stringify(line));
				console.log('Trimmed:', JSON.stringify(trimmed));
				
				const startsWithWardrobe = trimmed.startsWith('Wardrobe:');
				console.log('Starts with Wardrobe:', startsWithWardrobe);
				
				if (startsWithWardrobe) {
					const existingValue = trimmed.substring('Wardrobe:'.length).trim();
					console.log('Existing value:', JSON.stringify(existingValue));
				}
			}
		}
		
		expect(match).not.toBeNull();
	});
});