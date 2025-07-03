import { removeBidirectionalReference } from './frontmatter-modifier';

describe('User reported format debugging', () => {
	it('should test the exact format the user mentioned', () => {
		// The user mentioned this format: --- Outfits: "[[Note B]]" - "[[Note B]]" ---
		// This might be the current state after the bug occurred
		const malformedContent = `---
Outfits: "[[Note B]]" - "[[Note B]]"
---
Content`;

		console.log('USER REPORTED FORMAT:');
		console.log('This might be the result of the bug creating malformed YAML');
		console.log('Original:', malformedContent);

		const result = removeBidirectionalReference(malformedContent, 'Note B', 'Outfits');
		
		console.log('After removal:', result);
		
		// This should remove the property entirely since all instances of Note B are removed
		expect(result).toBe(`---
---
Content`);
	});

	it('should test normal format that might become malformed', () => {
		// Maybe the issue is in the ADD function creating malformed content
		// that the REMOVE function then can\'t handle properly
		
		const normalContent = `---
Outfits: ["[[Note A]]", "[[Note B]]"]
---
Content`;

		console.log('\nTESTING IF ADD FUNCTION CREATES MALFORMED YAML:');
		console.log('Normal content:', normalContent);

		// Let's see what happens if we add the same note multiple times
		// (this might be causing the malformed format)
		
		const result = removeBidirectionalReference(normalContent, 'Note B', 'Outfits');
		
		console.log('After removing Note B:', result);
		
		// This should keep the property with just Note A
		expect(result).toBe(`---
Outfits: "[[Note A]]"
---
Content`);
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Note A]]');
		expect(result).not.toContain('[[Note B]]');
	});

	it('should test what happens when removing from a single-item array', () => {
		const singleItemContent = `---
Outfits: ["[[Note B]]"]
---
Content`;

		console.log('\nSINGLE ITEM ARRAY TEST:');
		console.log('Before:', singleItemContent);

		const result = removeBidirectionalReference(singleItemContent, 'Note B', 'Outfits');
		
		console.log('After:', result);
		
		// When removing the only item, the property should be removed entirely
		expect(result).toBe(`---
---
Content`);
		expect(result).not.toContain('Outfits:');
	});

	it('should test what happens when removing from a two-item array', () => {
		const twoItemContent = `---
Outfits: ["[[Note A]]", "[[Note B]]"]
---
Content`;

		console.log('\nTWO ITEM ARRAY TEST:');
		console.log('Before:', twoItemContent);

		const result = removeBidirectionalReference(twoItemContent, 'Note B', 'Outfits');
		
		console.log('After:', result);
		
		// This should convert to a single value (not an array anymore)
		expect(result).toBe(`---
Outfits: "[[Note A]]"
---
Content`);
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Note A]]');
		expect(result).not.toContain('[[Note B]]');
	});
});