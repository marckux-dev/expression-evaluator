import { FormatNumberUsecase } from './format-number.usecase';

describe('Format Number Usecase', () => {
  const baseTestCases = [
    { input: Math.sin(Math.PI), expected: '1.2246467991473532e-16' },
    { input: 2e-10, expected: '2e-10' },
    { input: 2e-13, expected: '2e-13' },
    { input: 5.0, expected: '5' },
    { input: 1234567890123456, expected: '1234567890123456' },
  ];

  it('should apply no rounding at all if no parameter is given', () => {
    baseTestCases.forEach(({ input, expected }) => {
      // arrange
      const usecase = new FormatNumberUsecase();
      // act
      const result = usecase.execute(input);
      // assert
      expect(result).toBe(expected);
    });
  });

  describe('with a custom maxDecimals only', () => {
    it('should cap the decimal places shown', () => {
      const usecase = new FormatNumberUsecase(2);
      expect(usecase.execute(Math.PI)).toBe('3.14');
      expect(usecase.execute(-1.23456789)).toBe('-1.23');
    });

    it('should zero out a small number once maxDecimals is applied', () => {
      // with no parameters 2e-10 survives untouched (see base cases);
      // with maxDecimals=5 it is below the resolution and collapses to 0
      const usecase = new FormatNumberUsecase(5);
      expect(usecase.execute(2e-10)).toBe('0');
    });

    it('should accept 0 decimals and round to the nearest integer', () => {
      const usecase = new FormatNumberUsecase(0);
      expect(usecase.execute(3.7)).toBe('4');
    });

    it('should round instead of truncate at the decimals boundary', () => {
      // 9.9e-13 rounded to 12 decimals is 0.000000000001 = 1e-12, not 0
      const usecase = new FormatNumberUsecase(12);
      expect(usecase.execute(9.9e-13)).toBe('1e-12');
      expect(usecase.execute(1e-12)).toBe('1e-12');
    });
  });

  describe('with a custom maxSignificantDigits only', () => {
    it('should cap the significant digits shown for a large number', () => {
      const usecase = new FormatNumberUsecase(12, 3);
      expect(usecase.execute(6283.185307179586)).toBe('6280');
    });

    it('should round a small integer to the given number of significant digits', () => {
      const usecase = new FormatNumberUsecase(12, 1);
      expect(usecase.execute(456)).toBe('500');
    });
  });

  describe('with both parameters combined', () => {
    it('should let maxDecimals zero out a value before maxSignificantDigits applies', () => {
      const usecase = new FormatNumberUsecase(20, 2);
      expect(usecase.execute(0.000123456)).toBe('0.00012');
    });

    it('should collapse floating-point noise with maxDecimals, capped by maxSignificantDigits', () => {
      // with no parameters this value passes through untouched (see base cases);
      // maxDecimals=20 keeps it, maxSignificantDigits=5 caps the digits shown
      const usecase = new FormatNumberUsecase(20, 5);
      expect(usecase.execute(Math.sin(Math.PI))).toBe('1.2246e-16');
    });
  });

  describe('edge cases', () => {
    it('should format zero as "0" regardless of parameters', () => {
      expect(new FormatNumberUsecase().execute(0)).toBe('0');
      expect(new FormatNumberUsecase(0, 1).execute(0)).toBe('0');
    });

    it('should preserve the sign of a tiny negative number that survives rounding', () => {
      expect(new FormatNumberUsecase().execute(-1e-12)).toBe('-1e-12');
    });

    it('should not print trailing zeros for an exact integer result', () => {
      expect(new FormatNumberUsecase().execute(5.0)).toBe('5');
      expect(new FormatNumberUsecase(2, 12).execute(5.0)).toBe('5');
    });
  });
});
