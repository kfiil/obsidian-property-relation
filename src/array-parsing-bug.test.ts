import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Array parsing bug investigation', () => {
	it('should reproduce the exact malformed output bug', () => {
		// The user got: Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]
		// This suggests the array parsing is completely broken
		
		// Let's test what should be a simple case
		const content = `---
Wardrobe: ["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]
---
Content`;

		console.log('=== REPRODUCING ARRAY PARSING BUG ===');
		console.log('Input:');
		console.log(content);
		
		const result = removeBidirectionalReference(content, 'Bareen - Cloudy Grey', 'Wardrobe');
		
		console.log('\nOutput:');
		console.log(result);
		
		console.log('\nExpected:');
		console.log(`---
Wardrobe: "[[Box Fit Light]]"
---
Content`);
		
		// Check if we get the malformed output
		if (result.includes('[""') || result.includes(']]""')) {
			console.log('\n🐛 BUG CONFIRMED: Malformed quotes detected!');
		}
		
		// What it should be
		expect(result).toBe(`---
Wardrobe: "[[Box Fit Light]]"
---
Content`);
		expect(result).not.toContain('[""');
		expect(result).not.toContain(']]""');
	});

	it('should debug the array parsing step by step', () => {
		const existingValue = `["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]`;
		const sourceReference = `[[Bareen - Cloudy Grey]]`;
		
		console.log('\n=== STEP BY STEP ARRAY PARSING DEBUG ===');
		console.log('1. existingValue:', JSON.stringify(existingValue));
		console.log('2. sourceReference:', JSON.stringify(sourceReference));
		
		// Step 1: Check if it's recognized as array
		const isArray = existingValue.startsWith('[') && existingValue.endsWith(']') && !existingValue.startsWith('[[');
		console.log('3. isArray:', isArray);
		
		if (isArray) {
			// Step 2: Extract array content
			const arrayContent = existingValue.slice(1, -1);
			console.log('4. arrayContent:', JSON.stringify(arrayContent));
			
			// Step 3: Split by comma and process
			const items = arrayContent.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
			console.log('5. items after split and quote removal:', items);
			
			// Step 4: Filter out the target item
			const filteredItems = items.filter(item => item !== sourceReference);
			console.log('6. filteredItems after filtering:', filteredItems);
			
			// Step 5: Reconstruct array
			if (filteredItems.length === 1) {
				const singleValue = `"${filteredItems[0]}"`;
				console.log('7. singleValue result:', JSON.stringify(singleValue));
			} else if (filteredItems.length > 1) {
				const newArrayValue = `[${filteredItems.map(item => `"${item}"`).join(', ')}]`;
				console.log('7. newArrayValue result:', JSON.stringify(newArrayValue));
			}
		}
	});

	it('should test various problematic array formats', () => {
		const testCases = [
			{
				name: 'Standard array',
				input: `---
Wardrobe: ["[[Item A]]", "[[Item B]]"]
---
Content`,
				remove: 'Item A',
				expected: `---
Wardrobe: "[[Item B]]"
---
Content`
			},
			{
				name: 'Array with spaces in note names',
				input: `---
Wardrobe: ["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]
---
Content`,
				remove: 'Bareen - Cloudy Grey',
				expected: `---
Wardrobe: "[[Box Fit Light]]"
---
Content`
			},
			{
				name: 'Array with complex note names',
				input: `---
Wardrobe: ["[[Note With - Dashes]]", "[[Note With (Parens)]]", "[[Note With [Brackets]]]"]
---
Content`,
				remove: 'Note With - Dashes',
				expected: `---
Wardrobe: ["[[Note With (Parens)]]", "[[Note With [Brackets]]]"]
---
Content`
			}
		];

		testCases.forEach(testCase => {
			console.log(`\n--- Testing: ${testCase.name} ---`);
			console.log('Input:', testCase.input);
			
			const result = removeBidirectionalReference(testCase.input, testCase.remove, 'Wardrobe');
			
			console.log('Expected:', testCase.expected);
			console.log('Actual:', result);
			
			if (result !== testCase.expected) {
				console.log('❌ MISMATCH DETECTED');
				console.log('Difference in result:', {
					contains_malformed_quotes: result.includes('[""') || result.includes(']]""'),
					actual_wardrobe_line: result.match(/Wardrobe: .*/)?.[0] || 'NOT FOUND'
				});
			} else {
				console.log('✅ PASSED');
			}
		});
	});
});