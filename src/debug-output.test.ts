// Simple test to debug the exact issue
describe('Debug output', () => {
	it('should show debug information', () => {
		// Test the actual regex behavior
		const testString = '"[[Bareen - Cloudy Grey]]"';
		const result = testString.replace(/^"(.*)"$/, '$1');
		
		// Force output that Jest will show
		expect(result).toBe('[[Bareen - Cloudy Grey]]');
		
		// Test malformed input
		const malformed = '""[[Bareen - Cloudy Grey", "Box Fit Light]]""';
		const malformedSliced = malformed.slice(1, -1);
		expect(malformedSliced).toBe('"[[Bareen - Cloudy Grey", "Box Fit Light]]"');
		
		// Test splitting
		const items = malformedSliced.split(',');
		expect(items).toEqual(['"[[Bareen - Cloudy Grey"', ' "Box Fit Light]]"']);
		
		// Test regex on these items
		const processedItems = items.map(item => item.trim().replace(/^"(.*)"$/, '$1'));
		expect(processedItems).toEqual(['"[[Bareen - Cloudy Grey"', '"Box Fit Light]]"']);
		
		// This is the problem! The regex doesn't match because the quotes are incomplete
	});
});