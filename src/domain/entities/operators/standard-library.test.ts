import { evaluate } from '../../../index';
import { ValueError } from '../errors';

/**
 * Integration spec of the standard library of operators, exercised through
 * the full pipeline (evaluate). One block per field.
 */
describe('standard library of operators', () => {

  describe('arithmetic', () => {
    const cases: [string, number][] = [
      ['10 mod 3', 1],
      ['-7 mod 3', -1], // JS remainder semantics: sign follows the dividend
      ['abs(-5)', 5],
      ['abs 5', 5],
      ['floor(2.7)', 2],
      ['ceil(2.1)', 3],
      ['round(2.5)', 3],
      ['trunc(-2.7)', -2],
      ['sign(-3)', -1],
      ['sign(0)', 0],
      ['cbrt(27)', 3],
      ['cbrt(-8)', -2], // unlike sqrt, cbrt accepts negatives
      ['ln(exp(2))', 2],
      ['log(1000)', 3],
      ['tan(0)', 0],
      ['asin(1)', Math.PI / 2],
      ['acos(1)', 0],
      ['atan(1)', Math.PI / 4],
      ['min(3, 1, 2)', 1],
      ['min(5)', 5],
      ['gcd(12, 18)', 6],
      ['gcd(0, 5)', 5],
      ['lcm(4, 6)', 12],
      ['lcm(0, 5)', 0],
    ];
    it.each(cases)('%s = %d', (input, expected) => {
      expect(evaluate(input)).toBeCloseTo(expected, 10);
    });

    it('mod has the precedence of * and /', () => {
      expect(evaluate('10 mod 3 + 1')).toBe(2);
      expect(evaluate('2 + 10 mod 3')).toBe(3);
    });

    it('throws ValueError out of domain', () => {
      expect(() => evaluate('10 mod 0')).toThrow(ValueError);
      expect(() => evaluate('ln(0)')).toThrow(ValueError);
      expect(() => evaluate('log(-1)')).toThrow(ValueError);
      expect(() => evaluate('asin(2)')).toThrow(ValueError);
      expect(() => evaluate('acos(-1.5)')).toThrow(ValueError);
      expect(() => evaluate('gcd(1.5, 2)')).toThrow(ValueError);
      expect(() => evaluate('lcm(1, 2.5)')).toThrow(ValueError);
      expect(() => evaluate('min()')).toThrow(ValueError);
    });
  });

  describe('hyperbolic and angle conversion', () => {
    const cases: [string, number][] = [
      ['sinh(0)', 0],
      ['cosh(0)', 1],
      ['tanh(0)', 0],
      ['sinh(1)', Math.sinh(1)],
      ['asinh(sinh(2))', 2],
      ['acosh(cosh(2))', 2],
      ['atanh(tanh(0.5))', 0.5],
      // the hyperbolic identity; note ^ binds tighter than a prefix
      // function, so cosh(1)^2 would parse as cosh(1^2)
      ['(cosh 1)^2 - (sinh 1)^2', 1],
      ['deg(PI)', 180],
      ['deg(PI/2)', 90],
      ['rad(180)', Math.PI],
      ['sin(rad(90))', 1], // degree-mode trig via conversion
      ['deg(asin(1))', 90],
    ];
    it.each(cases)('%s = %d', (input, expected) => {
      expect(evaluate(input)).toBeCloseTo(expected, 10);
    });

    it('throws ValueError out of domain', () => {
      expect(() => evaluate('acosh(0.5)')).toThrow(ValueError);
      expect(() => evaluate('atanh(1)')).toThrow(ValueError);
      expect(() => evaluate('atanh(-2)')).toThrow(ValueError);
    });
  });

  describe('statistics (variadic)', () => {
    const cases: [string, number][] = [
      ['sum(1, 2, 3, 4)', 10],
      ['prod(2, 3, 4)', 24],
      ['mean(2, 4, 6)', 4],
      ['median(5, 1, 3)', 3],
      ['median(4, 1, 3, 2)', 2.5],
      ['stdev(2, 4, 4, 4, 5, 5, 7, 9)', 2.138089935299395], // sample, n-1
      ['stdevp(2, 4, 4, 4, 5, 5, 7, 9)', 2], // population, n
    ];
    it.each(cases)('%s = %d', (input, expected) => {
      expect(evaluate(input)).toBeCloseTo(expected, 10);
    });

    it('accepts expressions and variables as arguments', () => {
      expect(evaluate('mean(2*2, x, 8)', { x: 0 })).toBe(4);
      expect(evaluate('sum(1+1, 2*3)')).toBe(8);
    });

    it('throws ValueError on empty or insufficient argument lists', () => {
      expect(() => evaluate('sum()')).toThrow(ValueError);
      expect(() => evaluate('mean()')).toThrow(ValueError);
      expect(() => evaluate('stdev(5)')).toThrow(ValueError); // sample needs >= 2
    });
  });

  describe('combinatorics (infix, calculator convention)', () => {
    const cases: [string, number][] = [
      ['5 nCr 2', 10],
      ['5 nCr 0', 1],
      ['5 nCr 5', 1],
      ['52 nCr 5', 2598960], // poker hands
      ['5 nPr 2', 20],
      ['5 nPr 5', 120], // = 5!
      ['5 nPr 0', 1],
    ];
    it.each(cases)('%s = %d', (input, expected) => {
      expect(evaluate(input)).toBe(expected);
    });

    it('binds tighter than * and looser than ^', () => {
      expect(evaluate('2 * 5 nCr 2')).toBe(20); // 2 * (5 nCr 2)
      expect(evaluate('5 nCr 2 + 1')).toBe(11);
    });

    it('throws ValueError for non-integers, negatives or k > n', () => {
      expect(() => evaluate('5.5 nCr 2')).toThrow(ValueError);
      expect(() => evaluate('5 nCr (-1)')).toThrow(ValueError);
      expect(() => evaluate('2 nCr 5')).toThrow(ValueError);
      expect(() => evaluate('2 nPr 5')).toThrow(ValueError);
    });
  });

  describe('probability', () => {
    it('rand() returns a value in [0, 1)', () => {
      for (let i = 0; i < 20; i++) {
        const value = evaluate('rand()');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('rand() composes with the rest of the language', () => {
      const value = evaluate('floor(rand() * 6) + 1'); // a die roll
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });

    it('throws ValueError if rand receives arguments', () => {
      expect(() => evaluate('rand(1)')).toThrow(ValueError);
    });
  });

  describe('financial', () => {
    it('fv: compound future value', () => {
      // 1000 at 5% for 10 periods
      expect(evaluate('fv(0.05, 10, 1000)')).toBeCloseTo(1628.894626777442, 8);
      expect(evaluate('fv(0, 10, 1000)')).toBe(1000);
    });

    it('pv: discounted present value, inverse of fv', () => {
      expect(evaluate('pv(0.05, 10, 1628.894626777442)')).toBeCloseTo(1000, 8);
      expect(evaluate('pv(0.05, 10, fv(0.05, 10, 123))')).toBeCloseTo(123, 8);
    });

    it('pmt: amortizing loan payment (French system)', () => {
      // 200k mortgage, 30 years monthly at 5% annual: the classic 1073.64
      expect(evaluate('pmt(0.05/12, 360, 200_000)')).toBeCloseTo(1073.64, 2);
      // zero rate degrades to principal / periods
      expect(evaluate('pmt(0, 12, 1200)')).toBe(100);
    });

    it('composes with variables', () => {
      expect(
        evaluate('pmt(rate/12, years*12, amount)', { rate: 0.05, years: 30, amount: 200000 })
      ).toBeCloseTo(1073.64, 2);
    });

    it('throws ValueError out of domain', () => {
      expect(() => evaluate('fv(-2, 10, 1000)')).toThrow(ValueError);
      expect(() => evaluate('pmt(0.05, 0, 1000)')).toThrow(ValueError);
      expect(() => evaluate('pmt(0.05, 2.5, 1000)')).toThrow(ValueError);
    });
  });

});
