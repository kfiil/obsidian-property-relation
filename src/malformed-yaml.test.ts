import { addBidirectionalReference, removeBidirectionalReference } from './frontmatter-modifier';

describe('Malformed YAML investigation', () => {
	it('should handle removal from YAML block arrays', () => {
		const blockArrayContent = `---
Outfits:
  - "[[Note A]]"
  - "[[Note B]]"
  - "[[Note C]]"
---
Content`;

		const result = removeBidirectionalReference(blockArrayContent, 'Note B', 'Outfits');
		
		// Should convert to inline array and remove Note B
		expect(result).toBe(`---
Outfits: ["[[Note A]]", "[[Note C]]"]
---
Content`);
	});
	it('should handle content that already has mixed YAML format', () => {
		// What if the user's file already has this malformed format?
		const malformedContent = `---
Outfits: "[[Note B]]"
  - "[[Note B]]"
---
Content`;

		// Try to process it - what happens?
		const result = addBidirectionalReference(malformedContent, 'Note C', 'Outfits');
		
		console.log('MALFORMED INPUT:');
		console.log(malformedContent);
		console.log('\nRESULT:');
		console.log(result);
		
		// It should at least not make it worse
		expect(result).not.toContain('  - "[[Note B]]"\n  - "[[Note B]]"');
	});

	it('should handle content with YAML array in block format', () => {
		// Test with proper YAML block array format
		const blockArrayContent = `---
Outfits:
  - "[[Note A]]"
  - "[[Note B]]"
---
Content`;

		const result = addBidirectionalReference(blockArrayContent, 'Note C', 'Outfits');
		
		// This test will likely FAIL and show us the bug!
		// The result should be a proper inline array format
		expect(result).toBe(`---
Outfits: ["[[Note A]]", "[[Note B]]", "[[Note C]]"]
---
Content`);
	});

	it('should test what happens with manual YAML parsing', () => {
		// Let's see what our function thinks is the "value" of a block array property
		const content = `---
Outfits:
  - "[[Note A]]"
  - "[[Note B]]"
other: value
---
Content`;

		// Our regex and parsing might be mishandling this
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
		const match = content.match(frontmatterRegex);
		
		if (match) {
			const frontmatterContent = match[1];
			const lines = frontmatterContent.split('\n');
			
			console.log('FRONTMATTER LINES:');
			lines.forEach((line, index) => {
				console.log(`${index}: "${line}"`);
				const trimmed = line.trim();
				if (trimmed.startsWith('Outfits:')) {
					const existingValue = trimmed.substring('Outfits:'.length).trim();
					console.log(`  -> existingValue: "${existingValue}"`);
				}
			});
		}
	});
});