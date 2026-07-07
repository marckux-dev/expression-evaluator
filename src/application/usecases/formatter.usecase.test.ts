import {FormatterUsecase} from "./formatter.usecase";

describe('Formatter Use Case', () => {
  // Create a set of test cases and expected results
  const testCases = [
    { input: ' 5 +2   - 3 * (2+ 3)', expected: '5 + 2 - 3 * ( 2 + 3 )' },
    { input: ' sqrt(4)+2   ', expected: 'sqrt ( 4 ) + 2' },
    { input: '5^2 + 2', expected: '5 ^ 2 + 2' },
    { input: ' mean(1,2,3,_eof)', expected: 'mean ( 1 , 2 , 3 , _eof )' },
  ];
  it('should format the input correctly', () => {
    const formatter = new FormatterUsecase();
    testCases.forEach(testCase => {
      const result = formatter.execute(testCase.input);
      expect(result).toBe(testCase.expected);
    });
  });

  describe('scientific notation (e or E, as in JS number literals)', () => {
    const formatter = new FormatterUsecase();

    it('should keep a scientific literal as a single piece', () => {
      const testCases = [
        { input: '4e-10', expected: '4e-10' },
        { input: '4e10', expected: '4e10' },
        { input: '4e+10', expected: '4e+10' },
        { input: '1.5e3', expected: '1.5e3' },
        { input: '2.25e-4', expected: '2.25e-4' },
      ];
      testCases.forEach(testCase => {
        expect(formatter.execute(testCase.input)).toBe(testCase.expected);
      });
    });

    it('should keep scientific literals intact inside a larger expression', () => {
      const testCases = [
        { input: '2+4e-10', expected: '2 + 4e-10' },
        { input: '3e5*2', expected: '3e5 * 2' },
        { input: '(1e2+1)', expected: '( 1e2 + 1 )' },
        { input: '1e-2/4e2', expected: '1e-2 / 4e2' },
        { input: 'sqrt(4e2)', expected: 'sqrt ( 4e2 )' },
      ];
      testCases.forEach(testCase => {
        expect(formatter.execute(testCase.input)).toBe(testCase.expected);
      });
    });

    it('should separate a scientific literal from an adjacent word (implicit multiplication)', () => {
      expect(formatter.execute('4e-10PI')).toBe('4e-10 PI');
      expect(formatter.execute('2e3x')).toBe('2e3 x');
    });

    it('should accept uppercase E as exponent marker, like JS number literals', () => {
      const testCases = [
        { input: '4E-10', expected: '4E-10' },
        { input: '4E+10', expected: '4E+10' },
        { input: '1.5E3', expected: '1.5E3' },
        { input: '2E5*2', expected: '2E5 * 2' },
      ];
      testCases.forEach(testCase => {
        expect(formatter.execute(testCase.input)).toBe(testCase.expected);
      });
    });

    it('should NOT treat a trailing e/E without exponent digits as scientific', () => {
      expect(formatter.execute('2e')).toBe('2 e');
      expect(formatter.execute('2E')).toBe('2 E');
      expect(formatter.execute('2e+')).toBe('2 e +');
    });
  });

  describe('underscore digit grouping (as in JS number literals)', () => {
    const formatter = new FormatterUsecase();

    it('should collapse an underscore-grouped integer into a single number', () => {
      const testCases = [
        { input: '1_523_245', expected: '1523245' },
        { input: '1_000', expected: '1000' },
        { input: '1_2_3', expected: '123' },
      ];
      testCases.forEach(testCase => {
        expect(formatter.execute(testCase.input)).toBe(testCase.expected);
      });
    });

    it('should collapse an underscore-grouped integer part with a plain decimal part', () => {
      expect(formatter.execute('1_523_245.45')).toBe('1523245.45');
    });

    it('should collapse an underscore-grouped decimal part with a plain integer part', () => {
      expect(formatter.execute('1.000_001')).toBe('1.000001');
    });

    it('should collapse underscores on both the integer and decimal parts at once', () => {
      expect(formatter.execute('1_000.000_001')).toBe('1000.000001');
    });

    it('should keep grouped numbers intact inside a larger expression', () => {
      expect(formatter.execute('1_000 + 2_000')).toBe('1000 + 2000');
      expect(formatter.execute('sqrt(1_000_000)')).toBe('sqrt ( 1000000 )');
    });

    it('should separate a grouped number from an adjacent word (implicit multiplication)', () => {
      expect(formatter.execute('2_000PI')).toBe('2000 PI');
    });

    it('should NOT treat a plain leading-dot decimal as a grouped number', () => {
      // guards against the underscore rule accidentally claiming plain
      // digits: .5 must stay untouched, exactly as without this feature
      expect(formatter.execute('.5 + 1')).toBe('.5 + 1');
    });

    it('should NOT treat an identifier starting with underscore as a grouped number', () => {
      expect(formatter.execute('_tmp + 1')).toBe('_tmp + 1');
      expect(formatter.execute('mean(1,2,3,_eof)')).toBe('mean ( 1 , 2 , 3 , _eof )');
    });

    it('should NOT collapse plain numbers that have no underscore at all', () => {
      expect(formatter.execute('123 + 45.6')).toBe('123 + 45.6');
    });

    it('should split a double underscore into separate unrecognizable pieces, not silently misparse', () => {
      expect(formatter.execute('1__000')).toBe('1 __ 000');
    });

    it('should split a trailing underscore into separate unrecognizable pieces, not silently misparse', () => {
      expect(formatter.execute('12_')).toBe('12 _');
    });
  });
});