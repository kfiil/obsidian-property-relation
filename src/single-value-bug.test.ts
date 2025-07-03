import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Single value removal bug', () => {
	it('should fix the exact bug from debug output', () => {
		// This is the EXACT scenario from the debug output
		const content = `---
Outfits: "[[Note B]]"
---
`;

		const result = removeBidirectionalReference(content, 'Note B', 'Outfits');
		
		// Fixed behavior: property remains as empty array instead of being removed entirely
		expect(result).toBe(`---
Outfits: []
---
`);
		expect(result).toContain('Outfits: []');
		expect(result).not.toContain('[[Note B]]');
	});

	it('should keep empty property instead of removing it entirely', () => {
		// The user wants this behavior instead
		const content = `---
Outfits: "[[Note B]]"
other: value
---
`;

		const result = removeBidirectionalReference(content, 'Note B', 'Outfits');
		
		// The property should remain but be empty or have some placeholder
		// Options for what the user might want:
		// 1. Empty array: Outfits: []
		// 2. Empty string: Outfits: ""
		// 3. Remove property completely (current behavior)
		
		// Let's test what the user actually wants
		// I'll implement option 1 (empty array) as it's most logical
		expect(result).toBe(`---
Outfits: []
other: value
---
`);
		expect(result).toContain('Outfits:');
		expect(result).toContain('other: value');
		expect(result).not.toContain('[[Note B]]');
	});

	it('should handle single value removal from multi-property frontmatter', () => {
		const content = `---
title: My Note
Outfits: "[[Note B]]"
author: John
---
`;

		const result = removeBidirectionalReference(content, 'Note B', 'Outfits');
		
		// Should preserve other properties and keep empty Outfits property
		expect(result).toBe(`---
title: My Note
Outfits: []
author: John
---
`);
		expect(result).toContain('title: My Note');
		expect(result).toContain('Outfits: []');
		expect(result).toContain('author: John');
		expect(result).not.toContain('[[Note B]]');
	});

	it('should handle when property becomes empty in array format', () => {
		const content = `---
Outfits: ["[[Note B]]"]
---
`;

		const result = removeBidirectionalReference(content, 'Note B', 'Outfits');
		
		// Should result in empty array, not removed property
		expect(result).toBe(`---
Outfits: []
---
`);
		expect(result).toContain('Outfits: []');
		expect(result).not.toContain('[[Note B]]');
	});
});