import { CompileStandardExpressionUsecase } from './compile-standard-expression.usecase';
import { InvalidExpressionError, ValueError } from '../../domain/entities/errors';

const compiler = new CompileStandardExpressionUsecase();

describe('compile-standard-expression.usecase', () => {

  describe('compilation (execute)', () => {

    it('should return a callable compiled expression', () => {
      const compiled = compiler.execute('1 + 1');
      expect(typeof compiled).toBe('function');
    });

    it('should parse eagerly: a structurally malformed expression throws at compile time, before any invocation', () => {
      // these must throw from execute() itself, not from calling the result:
      // that is the whole point of compiling once
      expect(() => compiler.execute('3 + 4)')).toThrow(InvalidExpressionError); // extra closing bracket
      expect(() => compiler.execute('3 # 4')).toThrow(InvalidExpressionError);  // non-identifier symbol
      expect(() => compiler.execute('e + 1')).toThrow(InvalidExpressionError);  // e/E reserved, never a variable
      expect(() => compiler.execute('x_ + 1')).toThrow(InvalidExpressionError); // not a valid identifier shape
    });

    it('should throw at compile time for an empty or blank expression', () => {
      expect(() => compiler.execute('')).toThrow(InvalidExpressionError);
      expect(() => compiler.execute('   ')).toThrow(InvalidExpressionError);
    });

    it('should NOT require variable values at compile time: an unbound variable compiles fine', () => {
      // values arrive later; compiling a formula with free variables is the use case
      expect(() => compiler.execute('x ^ 2 + y ^ 2')).not.toThrow();
    });

  });

  describe('invocation', () => {

    it('should evaluate a constant expression with no variables', () => {
      const compiled = compiler.execute('2 + 3 * 5 - 6 * 2 + 1');
      expect(compiled()).toBe(6);
      expect(compiled({})).toBe(6);
    });

    it('should bind the variables passed on each invocation', () => {
      const compiled = compiler.execute('x + 1');
      expect(compiled({ x: 2 })).toBe(3);
    });

    it('should be reusable: one compile, many invocations with different values', () => {
      // parse P(x, y) = x^2 + y^2 once, evaluate it repeatedly
      const p = compiler.execute('x ^ 2 + y ^ 2');
      expect(p({ x: 3, y: 4 })).toBe(25);
      expect(p({ x: 0, y: 0 })).toBe(0);
      expect(p({ x: 1, y: 2 })).toBe(5);
      expect(p({ x: 5, y: 12 })).toBe(169);
    });

    it('should work with implicit multiplication against variables', () => {
      const examples: { input: string; variables: Record<string, number>; expected: number }[] = [
        { input: '2x', variables: { x: 3 }, expected: 6 },
        { input: 'x y', variables: { x: 3, y: 4 }, expected: 12 },
        { input: 'x(2 + 3)', variables: { x: 2 }, expected: 10 },
        { input: '2 x_1', variables: { x_1: 5 }, expected: 10 },
      ];
      examples.forEach(({ input, variables, expected }) => {
        expect(compiler.execute(input)(variables)).toBe(expected);
      });
    });

    it('should mix registered tokens, constants and variables', () => {
      const compiled = compiler.execute('sin(x) + max(y, 1) * PI');
      expect(compiled({ x: 0, y: 5 })).toBeCloseTo(5 * Math.PI, 10);
    });

    it('should bind a falsy 0 as a value, not treat it as missing', () => {
      const compiled = compiler.execute('x + 3');
      expect(compiled({ x: 0 })).toBe(3);
    });

    it('should not mutate the compiled expression between invocations', () => {
      const compiled = compiler.execute('x + 1');
      compiled({ x: 10 });
      expect(compiled({ x: 20 })).toBe(21); // second call unaffected by the first
    });

  });

  describe('invocation errors', () => {

    it('should throw InvalidExpressionError naming a variable whose value is missing', () => {
      const compiled = compiler.execute('x + y');
      expect(() => compiled({ x: 2 })).toThrow(InvalidExpressionError);
      expect(() => compiled({ x: 2 })).toThrow(/y/);
    });

    it('should throw InvalidExpressionError when a supplied name collides with a token or is malformed', () => {
      const compiled = compiler.execute('x + 1');
      expect(() => compiled({ PI: 5 })).toThrow(InvalidExpressionError);   // collides with a constant
      expect(() => compiled({ e: 5 })).toThrow(InvalidExpressionError);    // reserved
      expect(() => compiled({ x2: 5 })).toThrow(InvalidExpressionError);   // invalid variable name shape
    });

    it('should throw ValueError for out-of-domain operands at invocation', () => {
      expect(() => compiler.execute('x / 0')(({ x: 1 }))).toThrow(ValueError);
      expect(() => compiler.execute('sqrt(x)')({ x: -1 })).toThrow(ValueError);
      expect(() => compiler.execute('x!')({ x: -3 })).toThrow(ValueError);
    });

  });

});
