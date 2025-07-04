describe('Debug condition', () => {
	it('should check if condition matches', () => {
		const existingValue = '[""[[Bareen - Cloudy Grey", "Box Fit Light]]""]';
		const sourceReference = '[[Bareen - Cloudy Grey]]';
		const sourceNoteName = sourceReference.slice(2, -2); // Remove [[ and ]]
		
		console.log('existingValue:', existingValue);
		console.log('sourceReference:', sourceReference);
		console.log('sourceNoteName:', sourceNoteName);
		
		const includesReference = existingValue.includes(sourceReference);
		const includesNoteName = existingValue.includes(sourceNoteName);
		
		console.log('includes sourceReference:', includesReference);
		console.log('includes sourceNoteName:', includesNoteName);
		
		expect(includesReference || includesNoteName).toBe(true);
	});
});