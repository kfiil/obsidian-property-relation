import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Obsidian format specific tests', () => {
	it('should test what happens if the content already has malformed YAML', () => {
		// Maybe the user's file already contained malformed YAML that we're making worse?
		
		const malformedInput = `---
Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]
---
Content`;

		console.log('=== TESTING MALFORMED INPUT ===');
		console.log('Input (already malformed):');
		console.log(malformedInput);
		
		const result = removeBidirectionalReference(malformedInput, 'Bareen - Cloudy Grey', 'Wardrobe');
		
		console.log('\nResult:');
		console.log(result);
		
		// The function should handle this gracefully
		expect(result).not.toBe(malformedInput); // Should change something
	});

	it('should test with different YAML formatting styles', () => {
		// Different ways Obsidian might format arrays
		const formats = [
			{
				name: 'Standard format',
				content: `---
Wardrobe: ["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]
---`
			},
			{
				name: 'No spaces after commas',
				content: `---
Wardrobe: ["[[Bareen - Cloudy Grey]]","[[Box Fit Light]]"]
---`
			},
			{
				name: 'Extra spaces',
				content: `---
Wardrobe: [ "[[Bareen - Cloudy Grey]]" , "[[Box Fit Light]]" ]
---`
			},
			{
				name: 'Single quotes',
				content: `---
Wardrobe: ['[[Bareen - Cloudy Grey]]', '[[Box Fit Light]]']
---`
			},
			{
				name: 'Mixed quotes',
				content: `---
Wardrobe: ["[[Bareen - Cloudy Grey]]", '[[Box Fit Light]]']
---`
			},
			{
				name: 'No quotes (invalid YAML but might exist)',
				content: `---
Wardrobe: [[[Bareen - Cloudy Grey]], [[Box Fit Light]]]
---`
			}
		];

		formats.forEach(format => {
			console.log(`\n--- Testing: ${format.name} ---`);
			console.log('Input:', format.content);
			
			try {
				const result = removeBidirectionalReference(format.content + '\nContent', 'Bareen - Cloudy Grey', 'Wardrobe');
				console.log('Result:', result);
				
				// Check for any malformed patterns
				const hasMalformedQuotes = result.includes('[""') || result.includes(']]""');
				const hasMalformedBrackets = result.includes('["[[') && result.includes(']]"]');
				
				if (hasMalformedQuotes || hasMalformedBrackets) {
					console.log('❌ MALFORMED OUTPUT DETECTED');
					console.log('  Malformed quotes:', hasMalformedQuotes);
					console.log('  Malformed brackets:', hasMalformedBrackets);
				} else {
					console.log('✅ Output appears clean');
				}
			} catch (error) {
				console.log('❌ ERROR:', error.message);
			}
		});
	});

	it('should test the array reconstruction logic in isolation', () => {
		// Test the specific array reconstruction that might be causing issues
		
		console.log('\n=== ARRAY RECONSTRUCTION TEST ===');
		
		// Simulate the filtered items
		const testCases = [
			{
				name: 'One item remaining',
				filteredItems: ['[[Box Fit Light]]'],
				expected: '"[[Box Fit Light]]"'
			},
			{
				name: 'Multiple items remaining',
				filteredItems: ['[[Item A]]', '[[Item B]]', '[[Item C]]'],
				expected: '["[[Item A]]", "[[Item B]]", "[[Item C]]"]'
			},
			{
				name: 'Item with special characters',
				filteredItems: ['[[Bareen - Cloudy Grey]]'],
				expected: '"[[Bareen - Cloudy Grey]]"'
			},
			{
				name: 'Items with quotes in names',
				filteredItems: ['[[Item "With" Quotes]]'],
				expected: '"[[Item \\"With\\" Quotes]]"'
			}
		];

		testCases.forEach(testCase => {
			console.log(`\nTesting: ${testCase.name}`);
			console.log('Filtered items:', testCase.filteredItems);
			
			let result;
			if (testCase.filteredItems.length === 1) {
				result = `"${testCase.filteredItems[0]}"`;
			} else {
				result = `[${testCase.filteredItems.map(item => `"${item}"`).join(', ')}]`;
			}
			
			console.log('Result:', result);
			console.log('Expected:', testCase.expected);
			console.log('Match:', result === testCase.expected ? '✅' : '❌');
		});
	});
});