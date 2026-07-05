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
});