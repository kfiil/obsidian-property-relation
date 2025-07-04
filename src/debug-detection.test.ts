describe('Debug detection', () => {
	it('should test exact detection logic', () => {
		const existingValue = '[""[[Bareen - Cloudy Grey", "Box Fit Light]]""]';
		const sourceReference = '[[Bareen - Cloudy Grey]]';
		const sourceNoteNameFromRef = 'Bareen - Cloudy Grey';
		
		console.log('existingValue:', existingValue);
		console.log('sourceReference:', sourceReference);
		console.log('sourceNoteNameFromRef:', sourceNoteNameFromRef);
		
		const includesRef = existingValue.includes(sourceReference);
		const includesName = existingValue.includes(sourceNoteNameFromRef);
		
		console.log('includes sourceReference:', includesRef);
		console.log('includes sourceNoteNameFromRef:', includesName);
		console.log('at least one matches:', includesRef || includesName);
		
		// Test the specific substring
		console.log('indexOf sourceNoteNameFromRef:', existingValue.indexOf(sourceNoteNameFromRef));
		
		// This should be true since "Bareen - Cloudy Grey" is definitely in the malformed string
		expect(includesName).toBe(true);
	});
});