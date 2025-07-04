describe('Debug flow', () => {
	it('should test which condition triggers', () => {
		const existingValue: string = '[""[[Bareen - Cloudy Grey", "Box Fit Light]]""]';
		const sourceReference: string = '[[Bareen - Cloudy Grey]]';
		
		console.log('Testing conditions:');
		console.log('existingValue:', existingValue);
		console.log('sourceReference:', sourceReference);
		
		// Test condition 1: proper YAML array
		const condition1 = existingValue.startsWith('[') && existingValue.endsWith(']') && !existingValue.startsWith('[[');
		console.log('Condition 1 (proper YAML array):', condition1);
		
		// Test condition 2: exact single value match
		const condition2a = existingValue === `"${sourceReference}"`;
		const condition2b = existingValue === sourceReference;
		console.log('Condition 2a (quoted exact match):', condition2a);
		console.log('Condition 2b (unquoted exact match):', condition2b);
		
		// If none of the above, it goes to the malformed cleanup section
		const goesMalformed = condition1 === false && condition2a === false && condition2b === false;
		console.log('Goes to malformed cleanup:', goesMalformed);
		
		// In the malformed case, let's test what the cleanup would do
		if (goesMalformed) {
			console.log('\n--- Testing malformed cleanup ---');
			let newValue = existingValue;
			const sourceNoteName = 'Bareen - Cloudy Grey';
			
			// Remove complete wikilinks
			newValue = newValue.replace(new RegExp(`"?\\[\\[${sourceNoteName}\\]\\]"?`, 'g'), '');
			console.log('After removing complete wikilinks:', newValue);
			
			// Remove partial/broken wikilinks
			newValue = newValue.replace(new RegExp(`"?\\[\\[${sourceNoteName}"?`, 'g'), '');
			console.log('After removing opening partial:', newValue);
			
			newValue = newValue.replace(new RegExp(`"?${sourceNoteName}\\]\\]"?`, 'g'), '');
			console.log('After removing closing partial:', newValue);
		}
		
		expect(condition1).toBe(true); // This should be true, meaning it goes to array processing, not malformed cleanup
	});
});