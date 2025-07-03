import { removeBidirectionalReference } from './frontmatter-modifier';

// Test to debug the specific user issue
describe('Integration debugging', () => {
	it('should debug user-reported bug scenario', () => {
		// Test the exact scenario the user mentioned
		const content = `---
Outfits: "[[Note B]]"
---
Content`;

		console.log('BEFORE:');
		console.log(content);
		
		const result = removeBidirectionalReference(content, 'Note B', 'Outfits');
		
		console.log('\nAFTER:');
		console.log(result);
		
		// The user expects that removing "Note B" should remove the entire property
		// since it's the only value, but they report it's not working correctly
		expect(result).toBe(`---
---
Content`);
	});

	it('should test user scenario with array format', () => {
		const content = `---
Outfits: ["[[Note A]]", "[[Note B]]", "[[Note C]]"]
---
Content`;

		console.log('\nARRAY TEST BEFORE:');
		console.log(content);
		
		const result = removeBidirectionalReference(content, 'Note B', 'Outfits');
		
		console.log('\nARRAY TEST AFTER:');
		console.log(result);
		
		// This should remove only Note B, keeping the others
		expect(result).toBe(`---
Outfits: ["[[Note A]]", "[[Note C]]"]
---
Content`);
	});

	it('should test what happens with malformed input that user might have', () => {
		// The user mentioned this specific format: --- Outfits: "[[Note B]]" - "[[Note B]]" ---
		// This looks like malformed YAML that might have been created by a bug
		const malformedContent = `---
Outfits: "[[Note B]]" - "[[Note B]]"
---
Content`;

		console.log('\nMALFORMED TEST BEFORE:');
		console.log(malformedContent);
		
		const result = removeBidirectionalReference(malformedContent, 'Note B', 'Outfits');
		
		console.log('\nMALFORMED TEST AFTER:');
		console.log(result);
		
		// Let's understand what's happening
		const linesAfter = result.split('\n');
		console.log('\nLINES AFTER:');
		linesAfter.forEach((line, i) => console.log(`${i}: "${line}"`));
		
		// The function should detect the wikilink and remove it
		// The malformed format is now properly handled!
		expect(result).not.toContain('Note B'); // Should successfully remove the wikilink
		expect(result).not.toContain('Outfits:'); // Should remove the entire property
		
		// The malformed format is now properly handled, so it gets fixed
		expect(result).toBe(`---
---
Content`);
	});
});