import { DefineFunctionUsecase } from './define-function.usecase';
import { EvaluateStandardExpressionUsecase } from './evaluate-standard-expression.usecase';
import { TokenMapper } from '../mappers';
import { OperatorEntity, OperatorPosition } from '../../domain/entities';

const define = (name: string, params: string[], body: string): void =>
  new DefineFunctionUsecase().execute(name, params, body);

const evaluate = (expression: string): number =>
  new EvaluateStandardExpressionUsecase().execute(expression);

describe('define-function.usecase', () => {
  it('defines a single-parameter function usable in an expression', () => {
    define('inc', ['x'], 'x + 1');
    expect(evaluate('inc(3)')).toBe(4);
    expect(evaluate('inc(3) * 2')).toBe(8); // prefix precedence 85 binds before *
  });

  it('binds operands to parameters in written order (non-commutative body)', () => {
    // The stack reverses operands; the usecase must undo that so `sub(10, 3)`
    // is 10 - 3 = 7, not 3 - 10 = -7.
    define('sub', ['x', 'y'], 'x - y');
    expect(evaluate('sub(10, 3)')).toBe(7);
    expect(evaluate('sub(3, 10)')).toBe(-7);
  });

  it('supports multiple parameters', () => {
    define('hyp', ['x', 'y'], 'sqrt(x ^ 2 + y ^ 2)');
    expect(evaluate('hyp(3, 4)')).toBe(5);
  });

  it('composes with previously defined functions', () => {
    define('dbl', ['x'], '2 x');
    define('addone', ['x'], 'x + 1');
    define('f', ['x'], 'addone(dbl(x))'); // f(x) = 2x + 1
    expect(evaluate('f(5)')).toBe(11);
  });

  it('combines several functions in one body', () => {
    define('p', ['x'], 'x + 1');
    define('q', ['x'], 'x * 2');
    define('k', ['x'], 'p(x) + q(x)'); // k(3) = 4 + 6
    expect(evaluate('k(3)')).toBe(10);
  });

  it('registers the function in the TokenMapper with the right arity', () => {
    define('tri', ['a', 'b', 'c'], 'a + b + c');
    const mapper = TokenMapper.getInstance();
    expect(mapper.has('tri')).toBe(true);
    expect(mapper.getSymbols()).toContain('tri');
    const token = mapper.getToken('tri') as OperatorEntity;
    expect(token).toBeInstanceOf(OperatorEntity);
    expect(token.getNumberOfOperands()).toBe(3);
    expect(token.position).toBe(OperatorPosition.PREFIX);
  });

  it('captures the body at definition time (redefining a dependency does not change it)', () => {
    define('base', ['x'], 'x + 1');
    define('usesBase', ['x'], 'base(x) * 10'); // compiled against base = x + 1
    expect(evaluate('usesBase(2)')).toBe(30); // (2 + 1) * 10

    define('base', ['x'], 'x + 100'); // redefine base afterwards
    expect(evaluate('base(2)')).toBe(102); // new base is in effect
    expect(evaluate('usesBase(2)')).toBe(30); // but usesBase kept the old one
  });

  it('rejects a malformed body at definition time', () => {
    expect(() => define('bad', ['x'], 'x )')).toThrow(); // unbalanced bracket
    expect(() => define('empty', ['x'], '')).toThrow(); // empty body
  });
});
