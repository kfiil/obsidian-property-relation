import { preprocessYamlBlockArrays } from './yaml-preprocessor';

describe('Debug preprocessor', () => {
	it('should check what preprocessor does with malformed input', () => {
		const malformedYaml = `Wardrobe: [""[[Bareen - Cloudy Grey", "Box Fit Light]]""]`;
		
		console.log('Input to preprocessor:', malformedYaml);
		const result = preprocessYamlBlockArrays(malformedYaml);
		console.log('Preprocessor output:', result);
		
		// Force test to show results
		expect(result).toBe('FORCE_SHOW_RESULT');
	});
});