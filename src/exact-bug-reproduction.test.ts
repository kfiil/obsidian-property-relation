import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Exact bug reproduction', () => {
	it('should test with the exact note names from the user report', () => {
		// User got: Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]
		// This means the original array probably contained "Bareen - Cloudy Grey" and something else
		
		// Let's test with the exact names that caused the issue
		const content = `---
Wardrobe: ["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]
---
Content`;

		console.log('=== EXACT BUG REPRODUCTION ===');
		console.log('Input content:');
		console.log(JSON.stringify(content));
		
		const result = removeBidirectionalReference(content, 'Bareen - Cloudy Grey', 'Wardrobe');
		
		console.log('\nResult:');
		console.log(JSON.stringify(result));
		
		console.log('\nResult formatted:');
		console.log(result);
		
		// Check for the malformed pattern the user reported
		const malformedPattern = /\["".*?\]\]/;
		if (malformedPattern.test(result)) {
			console.log('\n🐛 MALFORMED PATTERN DETECTED!');
			console.log('Matches:', result.match(malformedPattern));
		}
		
		// Expected result
		const expected = `---
Wardrobe: "[[Box Fit Light]]"
---
Content`;
		
		expect(result).toBe(expected);
	});

	it('should test YAML preprocessor interaction', () => {
		// Maybe the issue is with the YAML preprocessor?
		// Let's test with block array format that gets preprocessed
		
		const blockArrayContent = `---
Wardrobe:
  - "[[Bareen - Cloudy Grey]]"
  - "[[Box Fit Light]]"
---
Content`;

		console.log('\n=== YAML PREPROCESSOR TEST ===');
		console.log('Block array input:');
		console.log(blockArrayContent);
		
		const result = removeBidirectionalReference(blockArrayContent, 'Bareen - Cloudy Grey', 'Wardrobe');
		
		console.log('\nResult after preprocessing and removal:');
		console.log(result);
		
		// This might be where the bug occurs
		expect(result).not.toContain('[""');
		expect(result).not.toContain(']]""');
	});

	it('should test edge cases with quotes and special characters', () => {
		// Test various combinations that might cause quote issues
		const edgeCases = [
			{
				name: 'Notes with quotes in names',
				content: `---
Wardrobe: ["[[Note \"With\" Quotes]]", "[[Regular Note]]"]
---
Content`,
				remove: 'Note "With" Quotes'
			},
			{
				name: 'Notes with brackets in names',
				content: `---
Wardrobe: ["[[Note [With] Brackets]]", "[[Regular Note]]"]
---
Content`,
				remove: 'Note [With] Brackets'
			},
			{
				name: 'Notes with commas in names',
				content: `---
Wardrobe: ["[[Note, With Comma]]", "[[Regular Note]]"]
---
Content`,
				remove: 'Note, With Comma'
			}
		];

		edgeCases.forEach(testCase => {
			console.log(`\n--- Testing: ${testCase.name} ---`);
			console.log('Input:', testCase.content);
			
			try {
				const result = removeBidirectionalReference(testCase.content, testCase.remove, 'Wardrobe');
				console.log('Result:', result);
				
				// Check for malformed patterns
				if (result.includes('[""') || result.includes(']]""') || result.includes('["[[')) {
					console.log('❌ MALFORMED OUTPUT DETECTED');
				} else {
					console.log('✅ No malformation detected');
				}
			} catch (error) {
				console.log('❌ ERROR:', error.message);
			}
		});
	});

	it('should manually test the regex and splitting logic', () => {
		// Let's manually test the exact regex and splitting that might be causing issues
		
		console.log('\n=== MANUAL REGEX TESTING ===');
		
		// Test the quote removal regex
		const testStrings = [
			'"[[Bareen - Cloudy Grey]]"',
			'"[[Box Fit Light]]"',
			'[[Bareen - Cloudy Grey]]', // without quotes
			'"[[Note with [brackets]]]"'
		];
		
		testStrings.forEach(str => {
			console.log(`Input: ${str}`);
			const result = str.replace(/^"(.*)"$/, '$1');
			console.log(`After quote removal: ${result}`);
			console.log(`Matches quote pattern: ${/^".*"$/.test(str)}`);
			console.log('---');
		});

		// Test array splitting
		console.log('\nArray splitting test:');
		const arrayContent = '"[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"';
		console.log('Array content:', arrayContent);
		
		const items = arrayContent.split(',').map(item => item.trim());
		console.log('After split:', items);
		
		const processedItems = items.map(item => item.replace(/^"(.*)"$/, '$1'));
		console.log('After quote removal:', processedItems);
	});
});