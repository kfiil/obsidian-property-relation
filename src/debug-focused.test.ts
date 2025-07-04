import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Debug focused', () => {
	it('should debug the malformed input processing', () => {
		const malformedContent = `---
Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]
---
Content`;

		const result = removeBidirectionalReference(malformedContent, 'Bareen - Cloudy Grey', 'Wardrobe');
		
		// Force a specific test to see what the result actually is
		expect(result).toBe('EXPECTED_DIFFERENT_RESULT'); // This will fail and show actual result
	});
});