import { addBidirectionalReference, removeBidirectionalReference } from './frontmatter-modifier';

describe('Frontmatter modification', () => {
	describe('addBidirectionalReference', () => {
		describe('when content has no frontmatter', () => {
			it('should create frontmatter with new property', () => {
				const content = 'Some content without frontmatter';
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: "[[Source Note]]"
---
Some content without frontmatter`);
			});

			it('should create frontmatter with empty content', () => {
				const content = '';
				const result = addBidirectionalReference(content, 'Source Note', 'projects');
				
				expect(result).toBe(`---
projects: "[[Source Note]]"
---
`);
			});
		});

		describe('when content has existing frontmatter', () => {
			it('should add new property to existing frontmatter', () => {
				const content = `---
title: Existing Note
---
Some content`;
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
title: Existing Note
related: "[[Source Note]]"
---
Some content`);
			});

			it('should not add duplicate reference to existing property', () => {
				const content = `---
related: "[[Source Note]]"
---
Some content`;
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: "[[Source Note]]"
---
Some content`);
			});

			it('should add to existing single value property', () => {
				const content = `---
related: "[[Other Note]]"
---
Some content`;
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: ["[[Other Note]]", "[[Source Note]]"]
---
Some content`);
			});

			it('should add to existing array property', () => {
				const content = `---
related: ["[[Note One]]", "[[Note Two]]"]
---
Some content`;
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: ["[[Note One]]", "[[Note Two]]", "[[Source Note]]"]
---
Some content`);
			});

			it('should add to empty array property', () => {
				const content = `---
related: []
---
Some content`;
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: ["[[Source Note]]"]
---
Some content`);
			});

			it('should add to empty property', () => {
				const content = `---
related: 
---
Some content`;
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: "[[Source Note]]"
---
Some content`);
			});
		});

		describe('edge cases', () => {
			it('should not create duplicates when adding to property with mixed format', () => {
				const content = `---
Outfits: "[[Note B]]"
---
Some content`;
				const result = addBidirectionalReference(content, 'Note B', 'Outfits');
				
				expect(result).toBe(`---
Outfits: "[[Note B]]"
---
Some content`);
			});

			it('should handle property names with special characters', () => {
				const content = `---
some-property: "[[Other Note]]"
---
Content`;
				const result = addBidirectionalReference(content, 'Source Note', 'some-property');
				
				expect(result).toBe(`---
some-property: ["[[Other Note]]", "[[Source Note]]"]
---
Content`);
			});

			it('should handle source note names with special characters', () => {
				const content = `---
---
Content`;
				const result = addBidirectionalReference(content, 'Note with spaces & symbols!', 'related');
				
				expect(result).toBe(`---
related: "[[Note with spaces & symbols!]]"
---
Content`);
			});

			it('should handle mixed wikilink formats in existing property', () => {
				const content = `---
related: "[[Note One]] and [[Note Two]]"
---
Content`;
				const result = addBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: ["[[Note One]] and [[Note Two]]", "[[Source Note]]"]
---
Content`);
			});
		});
	});

	describe('removeBidirectionalReference', () => {
		describe('when content has no frontmatter', () => {
			it('should return content unchanged', () => {
				const content = 'Some content without frontmatter';
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(content);
			});
		});

		describe('when content has frontmatter but no matching property', () => {
			it('should return content unchanged', () => {
				const content = `---
title: Some Note
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(content);
			});
		});

		describe('when property exists but reference is not found', () => {
			it('should return content unchanged', () => {
				const content = `---
related: "[[Other Note]]"
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(content);
			});
		});

		describe('when removing from single value property', () => {
			it('should remove property entirely when it matches exactly', () => {
				const content = `---
related: "[[Source Note]]"
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
---
Content`);
			});

			it('should remove property when it matches without quotes', () => {
				const content = `---
related: [[Source Note]]
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
---
Content`);
			});
		});

		describe('when removing from array property', () => {
			it('should remove specific reference from array', () => {
				const content = `---
related: ["[[Note One]]", "[[Source Note]]", "[[Note Two]]"]
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: ["[[Note One]]", "[[Note Two]]"]
---
Content`);
			});

			it('should convert to single value when only one item remains', () => {
				const content = `---
related: ["[[Source Note]]", "[[Other Note]]"]
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related: "[[Other Note]]"
---
Content`);
			});

			it('should remove property entirely when array becomes empty', () => {
				const content = `---
related: ["[[Source Note]]"]
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
---
Content`);
			});
		});

		describe('edge cases', () => {
			it('should handle complex frontmatter with multiple properties', () => {
				const content = `---
title: Test Note
tags: [tag1, tag2]
related: ["[[Note One]]", "[[Source Note]]"]
author: John
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
title: Test Note
tags: [tag1, tag2]
related: "[[Note One]]"
author: John
---
Content`);
			});

			it('should not modify properties with similar names', () => {
				const content = `---
related: ["[[Source Note]]"]
related-projects: ["[[Source Note]]"]
---
Content`;
				const result = removeBidirectionalReference(content, 'Source Note', 'related');
				
				expect(result).toBe(`---
related-projects: ["[[Source Note]]"]
---
Content`);
			});
		});
	});
});