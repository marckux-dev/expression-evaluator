import {EvaluateStandardExpressionUsecase} from "./evaluate-standard-expression.usecase";
import {InvalidExpressionError} from "../../domain/entities/errors";

/**
 * Spec of implicit multiplication, implemented by
 * `StandardExpressionBuilder.manageImplicitMultiplication()`.
 *
 * The rule: an implicit `*` is inserted between token i and i+1 when
 * i can END an operand and i+1 can START one:
 *
 *   ENDS an operand:   NUMBER, CONSTANT, `)`, POSTFIX operator
 *   STARTS an operand: CONSTANT, `(`, PREFIX operator
 *   STARTS, restricted: NUMBER — only after `)` or a POSTFIX operator.
 *     After a NUMBER or a CONSTANT it is an error instead: `2 3` and
 *     `PI 2` throw (a coefficient goes before, never after).
 *
 * Semantics for PREFIX functions: a prefix function absorbs the WHOLE
 * implicit product to its right — `sin 2 PI` is `sin(2*PI)`, and only an
 * explicit lower-precedence operator stops the absorption
 * (`sin 2 PI + 1` is `sin(2*PI) + 1`). To the left it is an ordinary
 * factor: `2 sin PI` is `2 * sin(PI)`.
 */
const evaluator = new EvaluateStandardExpressionUsecase();

describe('implicit multiplication', () => {

  describe('between values', () => {

    it('NUMBER CONSTANT, with and without space', () => {
      const examples = [
        { input: '2PI', expected: 2 * Math.PI },
        { input: '2 PI', expected: 2 * Math.PI },
        { input: '10PI', expected: 10 * Math.PI },
        { input: '3 PI', expected: 3 * Math.PI },
        { input: '2.5PI', expected: 2.5 * Math.PI },
      ];
      examples.forEach(({input, expected}) => {
        expect(evaluator.execute(input)).toBeCloseTo(expected, 10);
      });
    });

    it('CONSTANT CONSTANT (space-separated; `PIPI` would be a single unknown word)', () => {
      expect(evaluator.execute('PI PI')).toBeCloseTo(Math.PI * Math.PI, 10);
    });

    it('cascade of implicit multiplications', () => {
      expect(evaluator.execute('2 PI PI')).toBeCloseTo(2 * Math.PI * Math.PI, 8);
      expect(evaluator.execute('2PI(3+PI)4')).toBeCloseTo(2 * Math.PI * (3 + Math.PI) * 4, 8);
    });
  });

  describe('with brackets', () => {

    it('NUMBER followed by `(`', () => {
      const examples = [
        { input: '2(5+3)', expected: 16 },
        { input: '2(3+4)', expected: 14 },
        { input: '5(1-1)', expected: 0 },
      ];
      examples.forEach(({input, expected}) => {
        expect(evaluator.execute(input)).toBe(expected);
      });
    });

    it('CONSTANT followed by `(`', () => {
      expect(evaluator.execute('PI(3+PI)')).toBeCloseTo(Math.PI * (3 + Math.PI), 10);
      expect(evaluator.execute('PI(1+1)')).toBeCloseTo(2 * Math.PI, 10);
    });

    it('`)` followed by NUMBER', () => {
      expect(evaluator.execute('(1+2)3')).toBe(9);
      expect(evaluator.execute('(4+PI)2')).toBeCloseTo((4 + Math.PI) * 2, 10);
      expect(evaluator.execute('(1+PI)2')).toBeCloseTo((1 + Math.PI) * 2, 10);
    });

    it('`)` followed by CONSTANT', () => {
      expect(evaluator.execute('(2+3)PI')).toBeCloseTo(5 * Math.PI, 10);
      expect(evaluator.execute('(4+PI)PI')).toBeCloseTo((4 + Math.PI) * Math.PI, 10);
    });

    it('`)` followed by `(`', () => {
      expect(evaluator.execute('(1+2)(3+4)')).toBe(21);
      expect(evaluator.execute('(4 + PI)(3 + 2PI)')).toBeCloseTo((4 + Math.PI) * (3 + 2 * Math.PI), 8);
    });

    it('sign handling inside the second factor is preserved', () => {
      expect(evaluator.execute('2(-3)')).toBe(-6);
      expect(evaluator.execute('(-2)(-3)')).toBe(6);
    });
  });

  describe('with PREFIX functions', () => {

    it('NUMBER followed by a PREFIX function multiplies its result', () => {
      // 2 sqrt 4 is 2*sqrt(4) = 4, NOT sqrt(2*4) = 2.83
      expect(evaluator.execute('2 sqrt 4')).toBe(4);
      expect(evaluator.execute('2sqrt(4)')).toBe(4);
      expect(evaluator.execute('2 sin (PI/2)')).toBeCloseTo(2, 10);
      expect(evaluator.execute('2 sin PI')).toBeCloseTo(2 * Math.sin(Math.PI), 10);
    });

    it('CONSTANT followed by a PREFIX function multiplies its result', () => {
      // PI sqrt 9 is PI*3 = 9.42, NOT sqrt(9*PI) = 5.32
      expect(evaluator.execute('PI sqrt 9')).toBeCloseTo(3 * Math.PI, 10);
      expect(evaluator.execute('PI sqrt 4')).toBeCloseTo(2 * Math.PI, 10);
    });

    it('`)` followed by a PREFIX function multiplies its result', () => {
      // (5+PI) sqrt 4 + 2 is (5+PI)*2 + 2
      expect(evaluator.execute('(5+PI) sqrt 4 + 2')).toBeCloseTo((5 + Math.PI) * 2 + 2, 10);
      expect(evaluator.execute('(1+1) sqrt 9')).toBe(6);
    });

    it('a PREFIX function absorbs the whole implicit product to its right', () => {
      // sin 2 PI is sin(2*PI), NOT sin(2)*PI — the user-facing motivation
      expect(evaluator.execute('sin 2 PI + 1')).toBeCloseTo(Math.sin(2 * Math.PI) + 1, 10);
      // sqrt 4 PI is sqrt(4*PI) = 3.54, NOT sqrt(4)*PI = 6.28
      expect(evaluator.execute('sqrt 4 PI')).toBeCloseTo(Math.sqrt(4 * Math.PI), 10);
      // ...including nested function applications:
      // sqrt 4 sqrt 9 is sqrt(4*sqrt(9)) = sqrt(12) = 3.46, NOT sqrt(4)*sqrt(9) = 6
      expect(evaluator.execute('sqrt 4 sqrt 9')).toBeCloseTo(Math.sqrt(4 * Math.sqrt(9)), 10);
    });
  });

  describe('with POSTFIX operators', () => {

    it('POSTFIX followed by NUMBER, CONSTANT, `(` or PREFIX', () => {
      expect(evaluator.execute('3!2')).toBe(12);
      expect(evaluator.execute('3!PI')).toBeCloseTo(6 * Math.PI, 10);
      expect(evaluator.execute('3!(2+1)')).toBe(18);
      expect(evaluator.execute('3! sqrt 4')).toBe(12);
    });
  });

  describe('precedence of the implicit operator', () => {

    it('binds looser than `^`: 2PI^2 is 2*(PI^2)', () => {
      // 2*(PI^2) = 19.74, NOT (2*PI)^2 = 39.48
      expect(evaluator.execute('2PI^2')).toBeCloseTo(2 * Math.pow(Math.PI, 2), 10);
    });

    it('explicit operators around implicit products keep their meaning', () => {
      expect(evaluator.execute('1 + 2PI')).toBeCloseTo(1 + 2 * Math.PI, 10);
      // (2*PI)/(3*PI) = 2/3, NOT 2*PI/3*PI = 2*PI²/3
      expect(evaluator.execute('2PI/3PI')).toBeCloseTo(2 / 3, 10);
      expect(evaluator.execute('2PI+3PI')).toBeCloseTo(5 * Math.PI, 10);
    });
  });

  describe('inside variadic argument lists', () => {

    // The comma already flushes pending operators (ANALISIS.md §4.5),
    // so this only needs the implicit operator itself.
    it('each argument multiplies independently', () => {
      expect(evaluator.execute('max(2PI, 3PI)')).toBeCloseTo(3 * Math.PI, 10);
    });
  });

  describe('errors: adjacency that is NOT implicit multiplication', () => {

    it('NUMBER NUMBER throws InvalidExpressionError mentioning the missing operator', () => {
      expect(() => evaluator.execute('2 3')).toThrow(InvalidExpressionError);
      expect(() => evaluator.execute('2 3')).toThrow(/missing operator/i);
      expect(() => evaluator.execute('2.5 3.5')).toThrow(/missing operator/i);
    });

    it('CONSTANT NUMBER throws InvalidExpressionError mentioning the missing operator', () => {
      expect(() => evaluator.execute('PI2')).toThrow(InvalidExpressionError);
      expect(() => evaluator.execute('PI2')).toThrow(/missing operator/i);
      expect(() => evaluator.execute('PI 2')).toThrow(/missing operator/i);
    });
  });

  describe('guard rails (already true today, must stay true)', () => {

    it('a digit sequence is one number: 23 is twenty-three, never 2*3', () => {
      expect(evaluator.execute('23')).toBe(23);
    });

    it('explicit multiplication is unaffected', () => {
      expect(evaluator.execute('2 * PI')).toBeCloseTo(2 * Math.PI, 10);
    });

    it('a POSTFIX operator after `)` is still application, not multiplication', () => {
      expect(evaluator.execute('(2+3)!')).toBe(120);
    });
  });

});
