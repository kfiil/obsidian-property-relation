import { preprocessYamlBlockArrays } from './yaml-preprocessor';

describe('YAML preprocessor bug investigation', () => {
	it('should test if preprocessor creates malformed arrays', () => {
		// Test block array that might cause issues
		const blockArrayContent = `Wardrobe:
  - "[[Bareen - Cloudy Grey]]"
  - "[[Box Fit Light]]"`;

		console.log('=== YAML PREPROCESSOR BUG TEST ===');
		console.log('Input:');
		console.log(blockArrayContent);
		
		const result = preprocessYamlBlockArrays(blockArrayContent);
		
		console.log('\nOutput:');
		console.log(result);
		
		// Check if this creates malformed output
		if (result.includes('[""') || result.includes(']]""')) {
			console.log('\n🐛 PREPROCESSOR BUG DETECTED!');
		}
		
		// The issue might be here - if items already have quotes, we get double quotes
		expect(result).not.toContain('[""');
		expect(result).not.toContain(']]""');
	});

	it('should test the exact array reconstruction in preprocessor', () => {
		// Simulate what happens in the preprocessor
		console.log('\n=== PREPROCESSOR ARRAY RECONSTRUCTION ===');
		
		const blockArrayItems = [
			'"[[Bareen - Cloudy Grey]]"',  // Already quoted
			'"[[Box Fit Light]]"'          // Already quoted
		];
		
		console.log('Block array items:', blockArrayItems);
		
		// This is what the preprocessor does:
		const inlineArray = `[${blockArrayItems.join(', ')}]`;
		console.log('Inline array result:', inlineArray);
		
		// This creates: ["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]
		// Which is correct!
		
		expect(inlineArray).toBe('["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]');
	});

	it('should test various block array formats', () => {
		const testCases = [
			{
				name: 'Quoted items',
				input: `Wardrobe:
  - "[[Item A]]"
  - "[[Item B]]"`
			},
			{
				name: 'Unquoted items',
				input: `Wardrobe:
  - [[Item A]]
  - [[Item B]]`
			},
			{
				name: 'Mixed quoting',
				input: `Wardrobe:
  - "[[Item A]]"
  - [[Item B]]`
			},
			{
				name: 'Items with special characters',
				input: `Wardrobe:
  - "[[Bareen - Cloudy Grey]]"
  - "[[Box Fit Light]]"`
			}
		];

		testCases.forEach(testCase => {
			console.log(`\n--- Testing: ${testCase.name} ---`);
			console.log('Input:', testCase.input);
			
			const result = preprocessYamlBlockArrays(testCase.input);
			console.log('Output:', result);
			
			// Check for malformed patterns
			if (result.includes('[""') || result.includes(']]""')) {
				console.log('❌ MALFORMED OUTPUT');
			} else {
				console.log('✅ Clean output');
			}
		});
	});

	it('should test if malformed input to preprocessor causes issues', () => {
		// What if the preprocessor receives already malformed content?
		const malformedInput = `Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]
other: value`;

		console.log('\n=== MALFORMED INPUT TO PREPROCESSOR ===');
		console.log('Input:', malformedInput);
		
		const result = preprocessYamlBlockArrays(malformedInput);
		console.log('Output:', result);
		
		// Preprocessor should leave malformed content unchanged
		expect(result).toBe(malformedInput);
	});
});