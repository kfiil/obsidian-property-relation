import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Actual bug reproduction', () => {
	it('should reproduce the exact user-reported bug', () => {
		// Let's test the EXACT scenario the user is experiencing
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]", "[[Beach Outfit]]"]
---
Some content`;

		console.log('BEFORE REMOVAL:');
		console.log(content);
		
		// Remove "Winter Outfit" - this should KEEP the property with the other two values
		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		console.log('\nAFTER REMOVAL:');
		console.log(result);
		
		console.log('\nEXPECTED:');
		console.log(`---
Outfits: ["[[Summer Outfit]]", "[[Beach Outfit]]"]
---
Some content`);

		// The bug: if the entire property is removed, the result won't contain "Outfits:"
		if (!result.includes('Outfits:')) {
			console.log('\n🐛 BUG CONFIRMED: Entire property was removed instead of just the value!');
		} else {
			console.log('\n✅ Property preserved correctly');
		}
		
		// This test should pass if the bug is fixed
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).toContain('[[Beach Outfit]]');
		expect(result).not.toContain('[[Winter Outfit]]');
	});

	it('should test with different array format', () => {
		// Maybe the issue is with different array formats
		const content = `---
Outfits: 
  - "[[Summer Outfit]]"
  - "[[Winter Outfit]]"
  - "[[Beach Outfit]]"
---
Some content`;

		console.log('\nBLOCK ARRAY BEFORE REMOVAL:');
		console.log(content);
		
		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		console.log('\nBLOCK ARRAY AFTER REMOVAL:');
		console.log(result);
		
		// Check if the property still exists
		if (!result.includes('Outfits:')) {
			console.log('\n🐛 BUG CONFIRMED: Block array property was completely removed!');
		} else {
			console.log('\n✅ Block array property preserved correctly');
		}
		
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).toContain('[[Beach Outfit]]');
		expect(result).not.toContain('[[Winter Outfit]]');
	});

	it('should test with single quoted strings', () => {
		const content = `---
Outfits: ['[[Summer Outfit]]', '[[Winter Outfit]]', '[[Beach Outfit]]']
---
Some content`;

		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		console.log('\nSINGLE QUOTES BEFORE:');
		console.log(content);
		console.log('\nSINGLE QUOTES AFTER:');
		console.log(result);
		
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).toContain('[[Beach Outfit]]');
		expect(result).not.toContain('[[Winter Outfit]]');
	});
});