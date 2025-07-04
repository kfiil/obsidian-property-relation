import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Malformed input test', () => {
	it('should handle already malformed YAML input gracefully', () => {
		// Test what happens when the input is already malformed
		// This might be what the user is experiencing
		
		const malformedContent = `---
Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]
---
Content`;

		console.log('=== TESTING MALFORMED INPUT ===');
		console.log('Input content:');
		console.log(malformedContent);
		
		// This is what our function receives when the YAML is already malformed
		const result = removeBidirectionalReference(malformedContent, 'Bareen - Cloudy Grey', 'Wardrobe');
		
		console.log('\nResult:');
		console.log(result);
		
		// The function should either:
		// 1. Fix the malformed input, or 
		// 2. At minimum, not make it worse
		
		expect(result).not.toContain('[""');
		expect(result).not.toContain(']]""');
	});
	
	it('should test if the malformation happens during our processing', () => {
		// Start with clean input and see if WE create the malformation
		const cleanContent = `---
Wardrobe: ["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]
---
Content`;

		const result = removeBidirectionalReference(cleanContent, 'Bareen - Cloudy Grey', 'Wardrobe');
		
		// This should work perfectly and not create malformation
		expect(result).toBe(`---
Wardrobe: "[[Box Fit Light]]"
---
Content`);
		expect(result).not.toContain('[""');
		expect(result).not.toContain(']]""');
	});
});