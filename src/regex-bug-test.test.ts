describe('Regex bug investigation', () => {
	it('should test the quote removal regex that might be causing the issue', () => {
		console.log('=== QUOTE REMOVAL REGEX BUG TEST ===');
		
		// The problematic regex: /^"(.*)"$/
		// Let's test what happens with different inputs
		
		const testCases = [
			'"[[Bareen - Cloudy Grey]]"',
			'"[[Box Fit Light]]"',
			'[[Regular Note]]',  // No quotes
			'""[[Double Quoted]]""',  // Double quotes - this might be the issue!
			'"[[Note with "quotes" inside]]"'
		];
		
		testCases.forEach(testCase => {
			console.log(`\nTesting: ${testCase}`);
			const result = testCase.replace(/^"(.*)"$/, '$1');
			console.log(`Result: ${result}`);
			console.log(`Changed: ${testCase !== result}`);
		});
		
		// Now let's test what happens if we have malformed input already
		console.log('\n=== TESTING MALFORMED INPUT ===');
		const malformedArray = '[""[[Bareen - Cloudy Grey", "Box Fit Light]]""]';
		console.log(`Malformed input: ${malformedArray}`);
		
		// What happens when we slice off brackets?
		const arrayContent = malformedArray.slice(1, -1);
		console.log(`After slice: ${arrayContent}`);
		
		// What happens when we split by comma?
		const items = arrayContent.split(',');
		console.log(`After split: ${JSON.stringify(items)}`);
		
		// What happens when we apply the regex?
		const processedItems = items.map(item => item.trim().replace(/^"(.*)"$/, '$1'));
		console.log(`After regex: ${JSON.stringify(processedItems)}`);
		
		// Now what if we reconstruct the array?
		const filteredItems = processedItems.filter(item => item !== '[[Bareen - Cloudy Grey]]');
		console.log(`After filtering: ${JSON.stringify(filteredItems)}`);
		
		if (filteredItems.length === 1) {
			const result = `"${filteredItems[0]}"`;
			console.log(`Final result: ${result}`);
		}
	});
	
	it('should test the exact scenario that creates malformed output', () => {
		console.log('\n=== EXACT MALFORMATION SCENARIO ===');
		
		// What if the YAML preprocessor creates something like this:
		const preprocessedContent = 'Wardrobe: ["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]';
		console.log(`Preprocessed: ${preprocessedContent}`);
		
		// Extract the value
		const existingValue = '["[[Bareen - Cloudy Grey]]", "[[Box Fit Light]]"]';
		console.log(`Existing value: ${existingValue}`);
		
		// Slice off brackets
		const arrayContent = existingValue.slice(1, -1);
		console.log(`Array content: ${arrayContent}`);
		
		// Split and process
		const items = arrayContent.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
		console.log(`Items after processing: ${JSON.stringify(items)}`);
		
		// Filter out the target
		const sourceReference = '[[Bareen - Cloudy Grey]]';
		const filteredItems = items.filter(item => item !== sourceReference);
		console.log(`Filtered items: ${JSON.stringify(filteredItems)}`);
		
		// Reconstruct
		if (filteredItems.length === 1) {
			const result = `"${filteredItems[0]}"`;
			console.log(`Single item result: ${result}`);
		} else {
			const result = `[${filteredItems.map(item => `"${item}"`).join(', ')}]`;
			console.log(`Array result: ${result}`);
		}
		
		// This should work correctly... so the bug must be elsewhere
	});
	
	it('should test potential edge case with the regex', () => {
		console.log('\n=== REGEX EDGE CASE TEST ===');
		
		// What if there are extra quotes somehow?
		const edgeCases = [
			'"[[Note]]"',           // Normal
			'""[[Note]]""',         // Double quotes
			'"[[Note]]',            // Missing end quote
			'[[Note]]"',            // Missing start quote
			'"',                    // Just a quote
			'""',                   // Two quotes
			'"[[Note]]" extra',     // Quote with extra content
		];
		
		edgeCases.forEach(testCase => {
			console.log(`\nInput: "${testCase}"`);
			const result = testCase.replace(/^"(.*)"$/, '$1');
			console.log(`Output: "${result}"`);
			console.log(`Regex matched: ${/^".*"$/.test(testCase)}`);
		});
	});
});