import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Multiple relations bug investigation', () => {
	it('should debug removing one item from a multi-item array', () => {
		// Test the exact scenario: multiple relations, remove one
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]", "[[Beach Outfit]]"]
---
Content`;

		console.log('MULTIPLE RELATIONS TEST:');
		console.log('Before removal:');
		console.log(content);

		// This should work: remove one item, keep the others
		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		console.log('\nAfter removing Winter Outfit:');
		console.log(result);
		
		console.log('\nExpected result:');
		console.log(`---
Outfits: ["[[Summer Outfit]]", "[[Beach Outfit]]"]
---
Content`);

		// Check if this is causing an error
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[Summer Outfit]]');
		expect(result).toContain('[[Beach Outfit]]');
		expect(result).not.toContain('[[Winter Outfit]]');
	});

	it('should test with different quote styles in arrays', () => {
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]", "[[Beach Outfit]]"]
---
Content`;

		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		console.log('\nDOUBLE QUOTES TEST:');
		console.log('Input:', content);
		console.log('Output:', result);
		
		expect(result).toContain('Outfits:');
		expect(result).toContain('Summer Outfit');
		expect(result).toContain('Beach Outfit');
		expect(result).not.toContain('Winter Outfit');
	});

	it('should test array parsing logic step by step', () => {
		const content = `---
Outfits: ["[[A]]", "[[B]]", "[[C]]"]
---
Content`;

		// Debug the array parsing
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
		const match = content.match(frontmatterRegex);
		
		if (match) {
			const frontmatterContent = match[1];
			const lines = frontmatterContent.split('\n');
			
			console.log('\nARRAY PARSING DEBUG:');
			console.log('Frontmatter lines:', lines);
			
			for (const line of lines) {
				const trimmed = line.trim();
				console.log(`Line: "${trimmed}"`);
				
				if (trimmed.startsWith('Outfits:')) {
					const existingValue = trimmed.substring('Outfits:'.length).trim();
					console.log(`Existing value: "${existingValue}"`);
					
					// Check if it's recognized as an array
					if (existingValue.startsWith('[') && existingValue.endsWith(']') && !existingValue.startsWith('[[')) {
						console.log('✅ Recognized as array format');
						
						const arrayContent = existingValue.slice(1, -1);
						console.log(`Array content: "${arrayContent}"`);
						
						const items = arrayContent.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
						console.log('Parsed items:', items);
						
						const filteredItems = items.filter(item => item !== '[[B]]');
						console.log('Filtered items (removing [[B]]):', filteredItems);
						
					} else {
						console.log('❌ NOT recognized as array format');
					}
				}
			}
		}

		const result = removeBidirectionalReference(content, 'B', 'Outfits');
		console.log('\nFinal result:', result);
		
		expect(result).toContain('Outfits:');
		expect(result).toContain('[[A]]');
		expect(result).toContain('[[C]]');
		expect(result).not.toContain('[[B]]');
	});

	it('should test with spaces in array', () => {
		const content = `---
Outfits: [ "[[Summer Outfit]]", "[[Winter Outfit]]", "[[Beach Outfit]]" ]
---
Content`;

		console.log('\nSPACES IN ARRAY TEST:');
		console.log('Input:', content);

		const result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
		
		console.log('Output:', result);
		
		expect(result).toContain('Outfits:');
		expect(result).toContain('Summer Outfit');
		expect(result).toContain('Beach Outfit');
		expect(result).not.toContain('Winter Outfit');
	});

	it('should test error scenarios that might cause the user\'s error', () => {
		// Test scenarios that might cause JavaScript errors
		const scenarios = [
			{
				name: 'Empty array content',
				content: `---
Outfits: []
---
Content`
			},
			{
				name: 'Malformed array',
				content: `---
Outfits: ["[[A]]", "[[B]]"
---
Content`
			},
			{
				name: 'Mixed quotes',
				content: `---
Outfits: ["[[A]]", '[[B]]', "[[C]]"]
---
Content`
			},
			{
				name: 'No spaces after commas',
				content: `---
Outfits: ["[[A]]","[[B]]","[[C]]"]
---
Content`
			}
		];

		scenarios.forEach(scenario => {
			console.log(`\nTesting: ${scenario.name}`);
			console.log('Input:', scenario.content);
			
			try {
				const result = removeBidirectionalReference(scenario.content, 'B', 'Outfits');
				console.log('✅ Success:', result);
			} catch (error) {
				console.log('❌ Error:', error.message);
				// This might be where the user's error is coming from
			}
		});
	});
});