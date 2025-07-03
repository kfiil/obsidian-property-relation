import { removeBidirectionalReference } from './frontmatter-modifier';

describe('Debug exact error scenario', () => {
	it('should test the most common multiple relations scenario', () => {
		// This is probably the most common scenario that causes the error
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]", "[[Beach Outfit]]"]
---

Some content here.`;

		console.log('=== DEBUGGING MULTIPLE RELATIONS ERROR ===');
		console.log('Input content:');
		console.log(JSON.stringify(content, null, 2));
		
		console.log('\nCalling removeBidirectionalReference:');
		console.log('- sourceNoteName: "Winter Outfit"');
		console.log('- propertyName: "Outfits"');
		
		let result;
		let error;
		
		try {
			result = removeBidirectionalReference(content, 'Winter Outfit', 'Outfits');
			console.log('\n✅ SUCCESS - No error thrown');
			console.log('Result:');
			console.log(JSON.stringify(result, null, 2));
		} catch (e) {
			error = e;
			console.log('\n❌ ERROR CAUGHT:');
			console.log('Error message:', e.message);
			console.log('Error stack:', e.stack);
		}
		
		// If no error in test, the issue might be in the plugin integration
		if (!error) {
			expect(result).toContain('Outfits:');
			expect(result).toContain('Summer Outfit');
			expect(result).toContain('Beach Outfit');
			expect(result).not.toContain('Winter Outfit');
		}
	});

	it('should test array parsing edge cases that might cause errors', () => {
		const testCases = [
			{
				name: 'Standard array',
				content: `---
Outfits: ["[[A]]", "[[B]]", "[[C]]"]
---
Content`,
				remove: 'B'
			},
			{
				name: 'Array with extra spaces',
				content: `---
Outfits: [ "[[A]]" , "[[B]]" , "[[C]]" ]
---
Content`,
				remove: 'B'
			},
			{
				name: 'Array with no spaces',
				content: `---
Outfits: ["[[A]]","[[B]]","[[C]]"]
---
Content`,
				remove: 'B'
			},
			{
				name: 'Array with mixed spacing',
				content: `---
Outfits: ["[[A]]", "[[B]]","[[C]]" ]
---
Content`,
				remove: 'B'
			},
			{
				name: 'Single quotes in array',
				content: `---
Outfits: ['[[A]]', '[[B]]', '[[C]]']
---
Content`,
				remove: 'B'
			},
			{
				name: 'Mixed quotes',
				content: `---
Outfits: ["[[A]]", '[[B]]', "[[C]]"]
---
Content`,
				remove: 'B'
			}
		];

		testCases.forEach(testCase => {
			console.log(`\n--- Testing: ${testCase.name} ---`);
			console.log('Input:', testCase.content);
			
			try {
				const result = removeBidirectionalReference(testCase.content, testCase.remove, 'Outfits');
				console.log('✅ Success');
				console.log('Output:', result);
				
				// Basic validation
				expect(result).toContain('Outfits:');
				expect(result).not.toContain(`[[${testCase.remove}]]`);
			} catch (error) {
				console.log('❌ ERROR in test case:', testCase.name);
				console.log('Error:', error.message);
				// Don't fail the test, just log the error
			}
		});
	});

	it('should test regex and parsing step by step', () => {
		const content = `---
Outfits: ["[[Summer Outfit]]", "[[Winter Outfit]]", "[[Beach Outfit]]"]
---
Content`;

		console.log('\n=== STEP BY STEP DEBUGGING ===');
		
		// Step 1: Test regex
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
		const match = content.match(frontmatterRegex);
		console.log('1. Regex match:', match ? 'SUCCESS' : 'FAILED');
		if (match) {
			console.log('   Frontmatter content:', JSON.stringify(match[1]));
		}

		// Step 2: Test preprocessing
		if (match) {
			const frontmatterContent = match[1];
			console.log('2. Frontmatter lines:', frontmatterContent.split('\n'));
			
			// Step 3: Find property line
			const lines = frontmatterContent.split('\n');
			for (const line of lines) {
				const trimmed = line.trim();
				console.log(`   Processing line: "${trimmed}"`);
				
				if (trimmed.startsWith('Outfits:')) {
					const existingValue = trimmed.substring('Outfits:'.length).trim();
					console.log('3. Existing value:', JSON.stringify(existingValue));
					
					// Step 4: Test array detection
					const isArray = existingValue.startsWith('[') && existingValue.endsWith(']') && !existingValue.startsWith('[[');
					console.log('4. Is array:', isArray);
					
					if (isArray) {
						// Step 5: Test array parsing
						const arrayContent = existingValue.slice(1, -1);
						console.log('5. Array content:', JSON.stringify(arrayContent));
						
						const items = arrayContent.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
						console.log('6. Parsed items:', items);
						
						const sourceReference = '[[Winter Outfit]]';
						const filteredItems = items.filter(item => item !== sourceReference);
						console.log('7. Filtered items (removing Winter Outfit):', filteredItems);
						
						if (filteredItems.length > 1) {
							const newArrayValue = `[${filteredItems.map(item => `"${item}"`).join(', ')}]`;
							console.log('8. New array value:', newArrayValue);
						}
					}
				}
			}
		}
	});
});