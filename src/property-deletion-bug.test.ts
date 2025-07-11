import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Property deletion bug', () => {
	it('should remove only the specific link, not the entire property when property has other links', () => {
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]", "[[Beach Outfit]]"]
---
Content`;

		// Remove only "Winter Outfit" - the property should remain with the other links
		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		expect(result).toBe(`---
Outfits: ["[[Summer Outfit]]", "[[Beach Outfit]]"]
---
Content`);
		
		// The property should NOT be deleted entirely
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).toContain('[[Beach Outfit]]');
		expect(result).not.toContain('[[Winter Outfit]]');
	});

	it('should keep property as empty array when it becomes empty after removal', () => {
		const content = `---
title: Test Note
Outfits: "[[Only Outfit]]"
author: John
---
Content`;

		// Remove the only link - property should become empty array, not removed entirely
		const result = removeBidirectionalReference(content, 'Only Outfit', 'Outfits');
		
		expect(result).toBe(`---
title: Test Note
Outfits: []
author: John
---
Content`);
		
		// Property should remain as empty array
		expect(result).toContain('Outfits: []');
		expect(result).not.toContain('[[Only Outfit]]');
		// Other properties should remain
		expect(result).toContain('title: Test Note');
		expect(result).toContain('author: John');
	});

	it('should preserve property when removing non-existent link', () => {
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]"]
---
Content`;

		// Try to remove a link that doesn't exist
		const result = removeBidirectionalReference(content, 'Non Existent Outfit', 'Outfits');
		
		// Should be unchanged
		expect(result).toBe(content);
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).toContain('[[Winter Outfit]]');
	});

	it('should handle single link in array format correctly', () => {
		const content = `---
Outfits: ["[[Only Outfit]]"]
---
Content`;

		// Remove the single link from array - property should become empty array
		const result = removeBidirectionalReference(content, 'Only Outfit', 'Outfits');
		
		expect(result).toBe(`---
Outfits: []
---
Content`);
		expect(result).toContain('Outfits: []');
	});

	it('should convert array to single value when removing from 2-item array', () => {
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]"]
---
Content`;

		// Remove one item, should convert to single value format
		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		expect(result).toBe(`---
Outfits: "[[Summer Outfit]]"
---
Content`);
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).not.toContain('[[Winter Outfit]]');
	});

	it('should handle malformed YAML by removing wikilinks from any string value', () => {
		// This is the bug the user reported - malformed YAML like: "[[Note B]]" - "[[Note B]]"
		const malformedContent = `---
Outfits: "[[Note B]]" - "[[Note B]]"
---
Content`;

		// Remove Note B - should keep property as empty array since all wikilinks are removed
		const result = removeBidirectionalReference(malformedContent, 'Note B', 'Outfits');
		
		// The property should become empty array after removing all instances of [[Note B]]
		expect(result).toBe(`---
Outfits: []
---
Content`);
		expect(result).toContain('Outfits: []');
		expect(result).not.toContain('[[Note B]]');
	});

	it('should handle malformed YAML with mixed content', () => {
		// Another malformed case: valid wikilink mixed with other content
		const malformedContent = `---
Outfits: "[[Note A]]" and some text "[[Note B]]" more text
---
Content`;

		// Remove Note B - should remove just that wikilink, keep the rest
		const result = removeBidirectionalReference(malformedContent, 'Note B', 'Outfits');
		
		// Should remove only the [[Note B]] wikilink, preserve the rest
		expect(result).toBe(`---
Outfits: "[[Note A]]" and some text more text
---
Content`);
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Note A]]');
		expect(result).not.toContain('[[Note B]]');
	});
});