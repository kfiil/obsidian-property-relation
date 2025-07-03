import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Real-world scenario debugging', () => {
	it('should debug the exact plugin call scenario', () => {
		// Simulate the exact scenario: 
		// User has Note A with Outfits: ["[[Note B]]", "[[Note C]]"]
		// User removes Note B from Note A
		// Plugin should call removeBidirectionalReference on Note B to remove Note A from its property
		
		const noteAContent = `---
Outfits: ["[[Note B]]", "[[Note C]]"]
---
This is Note A content`;

		const noteBContent = `---
Wardrobe: ["[[Note A]]", "[[Some Other Note]]"]
---
This is Note B content`;

		console.log('SCENARIO: User removes "Note B" from Note A\'s Outfits property');
		console.log('Plugin should then remove "Note A" from Note B\'s Wardrobe property');
		console.log('\nNote B BEFORE (should have Note A in Wardrobe):');
		console.log(noteBContent);
		
		// This simulates the plugin call: removeFromTargetNote(noteA, "Note B", "Outfits", "Wardrobe")
		// Which calls: removeBidirectionalReference(noteBContent, "Note A", "Wardrobe")
		const result = removeBidirectionalReference(noteBContent, 'Note A', 'Wardrobe');
		
		console.log('\nNote B AFTER (should still have Wardrobe property, but without Note A):');
		console.log(result);
		
		// The bug would be if the entire Wardrobe property is gone
		if (!result.includes('Wardrobe:')) {
			console.log('\n🐛 BUG CONFIRMED: Entire Wardrobe property was removed!');
			console.log('Expected: Wardrobe should still exist with ["[[Some Other Note]]"]');
		} else {
			console.log('\n✅ Wardrobe property preserved correctly');
		}

		expect(result).toContain('Wardrobe:');
		expect(result).toContain('[[Some Other Note]]');
		expect(result).not.toContain('[[Note A]]');
	});

	it('should test case sensitivity issues', () => {
		const content = `---
Outfits: ["[[Note A]]", "[[note b]]"]
---
Content`;

		// Test if case sensitivity might be the issue
		const result1 = removeBidirectionalReference(content, 'Note A', 'Outfits');
		const result2 = removeBidirectionalReference(content, 'note b', 'Outfits');
		const result3 = removeBidirectionalReference(content, 'Note B', 'Outfits'); // Wrong case

		console.log('\nCASE SENSITIVITY TEST:');
		console.log('Original:', content);
		console.log('Remove "Note A":', result1);
		console.log('Remove "note b":', result2);
		console.log('Remove "Note B" (wrong case):', result3);

		expect(result1).toContain('Outfits:');
		expect(result1).toContain('[[note b]]');
		expect(result1).not.toContain('[[Note A]]');
	});

	it('should test edge case with property name casing', () => {
		const content = `---
outfits: ["[[Note A]]", "[[Note B]]"]
Outfits: ["[[Note C]]"]
---
Content`;

		// What if there are multiple properties with different cases?
		const result = removeBidirectionalReference(content, 'Note A', 'outfits');
		
		console.log('\nPROPERTY CASE TEST:');
		console.log('Original:', content);
		console.log('Remove "Note A" from "outfits":', result);

		expect(result).toContain('outfits:');
		expect(result).toContain('Outfits:'); // Other property should remain
		expect(result).toContain('[[Note B]]');
		expect(result).toContain('[[Note C]]');
		expect(result).not.toContain('[[Note A]]');
	});

	it('should debug with actual file content format', () => {
		// Maybe the issue is with how Obsidian formats the frontmatter
		const obsidianFormatContent = `---
Outfits:
  - "[[Summer Outfit]]"
  - "[[Winter Outfit]]"
  - "[[Beach Outfit]]"
---

# My Note

Some content here.`;

		console.log('\nOBSIDIAN FORMAT TEST:');
		console.log('Before removal:');
		console.log(obsidianFormatContent);

		const result = removeBidirectionalReference(obsidianFormatContent, 'Winter Outfit', 'Outfits');
		
		console.log('\nAfter removing Winter Outfit:');
		console.log(result);

		if (!result.includes('Outfits:')) {
			console.log('\n🐛 BUG: Block array format caused entire property removal!');
		}

		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).toContain('[[Beach Outfit]]');
		expect(result).not.toContain('[[Winter Outfit]]');
	});
});