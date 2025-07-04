describe('Debug array processing', () => {
	it('should test what happens in array processing with malformed input', () => {
		const existingValue = '[""[[Bareen - Cloudy Grey", "Box Fit Light]]""]';
		const sourceReference = '[[Bareen - Cloudy Grey]]';
		
		console.log('=== ARRAY PROCESSING DEBUG ===');
		console.log('existingValue:', existingValue);
		console.log('sourceReference:', sourceReference);
		
		// This is what the array processing does:
		const arrayContent = existingValue.slice(1, -1);
		console.log('arrayContent after slice:', arrayContent);
		
		const items = arrayContent.split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
		console.log('items after split and regex:', items);
		
		const filteredItems = items.filter(item => item !== sourceReference);
		console.log('filteredItems after filtering:', filteredItems);
		
		console.log('filteredItems.length:', filteredItems.length);
		
		if (filteredItems.length === 1) {
			const result = `"${filteredItems[0]}"`;
			console.log('Single item result:', result);
		} else {
			const result = `[${filteredItems.map(item => `"${item}"`).join(', ')}]`;
			console.log('Array result:', result);
		}
		
		// The issue: none of the items exactly match sourceReference because they're malformed
		expect(filteredItems.length).toBe(2); // Should be 2 malformed items, not 1 cleaned item
	});
});