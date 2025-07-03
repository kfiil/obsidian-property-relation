import { extractWikilinks } from './wikilink-extractor';

describe('Wikilink extraction', () => {
	describe('when extracting from null or undefined values', () => {
		it('should return empty array for null value', () => {
			const result = extractWikilinks(null);
			expect(result).toEqual([]);
		});

		it('should return empty array for undefined value', () => {
			const result = extractWikilinks(undefined);
			expect(result).toEqual([]);
		});
	});

	describe('when extracting from string values', () => {
		it('should extract single wikilink from string', () => {
			const result = extractWikilinks('[[Note Name]]');
			expect(result).toEqual(['Note Name']);
		});

		it('should extract multiple wikilinks from string', () => {
			const result = extractWikilinks('[[First Note]] and [[Second Note]]');
			expect(result).toEqual(['First Note', 'Second Note']);
		});

		it('should return empty array for string without wikilinks', () => {
			const result = extractWikilinks('Just plain text');
			expect(result).toEqual([]);
		});

		it('should handle wikilinks with special characters', () => {
			const result = extractWikilinks('[[Note-with-dashes]] and [[Note with spaces & symbols!]]');
			expect(result).toEqual(['Note-with-dashes', 'Note with spaces & symbols!']);
		});

		it('should handle wikilinks with pipes (aliases)', () => {
			const result = extractWikilinks('[[Actual Note|Display Name]]');
			expect(result).toEqual(['Actual Note|Display Name']);
		});
	});

	describe('when extracting from array values', () => {
		it('should extract wikilinks from array of strings', () => {
			const result = extractWikilinks(['[[First Note]]', '[[Second Note]]']);
			expect(result).toEqual(['First Note', 'Second Note']);
		});

		it('should extract multiple wikilinks from single array element', () => {
			const result = extractWikilinks(['[[First Note]] and [[Second Note]]']);
			expect(result).toEqual(['First Note', 'Second Note']);
		});

		it('should handle mixed array with wikilinks and plain text', () => {
			const result = extractWikilinks(['[[Note One]]', 'plain text', '[[Note Two]]']);
			expect(result).toEqual(['Note One', 'Note Two']);
		});

		it('should handle empty array', () => {
			const result = extractWikilinks([]);
			expect(result).toEqual([]);
		});

		it('should handle array with non-string elements', () => {
			const result = extractWikilinks(['[[Valid Note]]', 123, null, '[[Another Note]]']);
			expect(result).toEqual(['Valid Note', 'Another Note']);
		});
	});

	describe('when extracting from complex values', () => {
		it('should return empty array for numeric values', () => {
			const result = extractWikilinks(123);
			expect(result).toEqual([]);
		});

		it('should return empty array for boolean values', () => {
			const result = extractWikilinks(true);
			expect(result).toEqual([]);
		});

		it('should return empty array for object values', () => {
			const result = extractWikilinks({ key: 'value' });
			expect(result).toEqual([]);
		});
	});

	describe('edge cases', () => {
		it('should handle malformed wikilinks', () => {
			const result = extractWikilinks('[[Unclosed wikilink and [incomplete');
			expect(result).toEqual([]);
		});

		it('should handle nested brackets', () => {
			const result = extractWikilinks('[[Note with [brackets] inside]]');
			expect(result).toEqual(['Note with [brackets] inside']);
		});

		it('should handle empty wikilinks', () => {
			const result = extractWikilinks('[[]]');
			expect(result).toEqual(['']);
		});

		it('should handle wikilinks with only whitespace', () => {
			const result = extractWikilinks('[[   ]]');
			expect(result).toEqual(['   ']);
		});

		it('should not extract partial wikilinks', () => {
			const result = extractWikilinks('[Note] and [[Valid Note]]');
			expect(result).toEqual(['Valid Note']);
		});
	});
});