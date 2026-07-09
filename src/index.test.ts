import { evaluate, evaluateRpn, compile } from './index';
import { InvalidExpressionError, ValueError } from './domain/entities/errors';

describe('evaluate() with variables', () => {
  it('should substitute a single variable', () => {
    expect(evaluate('x + 1', { x: 2 })).toBe(3);
  });

  it('should substitute multiple variables', () => {
    expect(evaluate('x + y * 2', { x: 1, y: 5 })).toBe(11);
  });

  it('should use the same variable more than once in the expression', () => {
    expect(evaluate('x * x + x', { x: 3 })).toBe(12);
  });

  it('should combine variables with built-in constants', () => {
    expect(evaluate('x + PI', { x: 1 })).toBeCloseTo(1 + Math.PI, 10);
  });

  it('should combine variables with unary and binary operators', () => {
    expect(evaluate('-x + 3', { x: 5 })).toBe(-2);
    expect(evaluate('x^2', { x: 3 })).toBe(9);
    expect(evaluate('x!', { x: 4 })).toBe(24);
  });

  it('should combine variables with brackets and precedence', () => {
    expect(evaluate('(x + y) * 2', { x: 1, y: 2 })).toBe(6);
    expect(evaluate('x + y * 2', { x: 10, y: 3 })).toBe(16);
  });

  it('should pass a variable as an argument to a function', () => {
    expect(evaluate('sin(x)', { x: 0 })).toBe(0);
    expect(evaluate('max(x, y, 1)', { x: -2, y: 5 })).toBe(5);
  });

  it('should evaluate to the same result as the equivalent literal expression', () => {
    expect(evaluate('x + y * 2', { x: 1, y: 5 })).toBe(evaluate('1 + 5 * 2'));
  });

  it('should accept an empty variables object exactly like omitting it', () => {
    expect(evaluate('2 + 3', {})).toBe(evaluate('2 + 3'));
  });

  it('should keep working without a variables argument at all (no regression)', () => {
    expect(evaluate('2 + 3 * 4')).toBe(14);
  });

  it('should throw InvalidExpressionError when the expression uses an undeclared variable', () => {
    expect(() => evaluate('x + 1', { y: 2 })).toThrow(InvalidExpressionError);
    expect(() => evaluate('x + 1')).toThrow(InvalidExpressionError);
  });

  it('should throw the same error whether or not a variables object was passed', () => {
    let messageWithoutArg = '';
    let messageWithUnrelatedArg = '';
    try {
      evaluate('x + 1');
    } catch (e: any) {
      messageWithoutArg = e.message;
    }
    try {
      evaluate('x + 1', { y: 2 });
    } catch (e: any) {
      messageWithUnrelatedArg = e.message;
    }
    expect(messageWithoutArg).toBe(messageWithUnrelatedArg);
  });

  it('should throw InvalidExpressionError when a variable name collides with a built-in symbol', () => {
    expect(() => evaluate('1 + 1', { PI: 5 })).toThrow(InvalidExpressionError);
    expect(() => evaluate('1 + 1', { sin: 5 })).toThrow(InvalidExpressionError);
    expect(() => evaluate('1 + 1', { '+': 5 })).toThrow(InvalidExpressionError);
  });

  it('should throw the collision error even if the colliding variable is never used in the expression', () => {
    expect(() => evaluate('2 + 2', { PI: 5 })).toThrow(InvalidExpressionError);
  });

  it('should ignore variables that are provided but not referenced in the expression', () => {
    expect(evaluate('2 + 2', { x: 100, y: 200 })).toBe(4);
  });

  describe('variables and implicit multiplication', () => {
    // Variables follow the named-constant adjacency rules (like PI), not
    // the numeric-literal ones: a coefficient goes before, never after.
    it('should apply implicit multiplication between a number and a variable (2x)', () => {
      expect(evaluate('2x', { x: 3 })).toBe(6);
    });

    it('should evaluate 2x the same as 2*x', () => {
      expect(evaluate('2x', { x: 7 })).toBe(evaluate('2*x', { x: 7 }));
    });

    it('should throw when a number follows a variable (x2)', () => {
      expect(() => evaluate('x2', { x: 3 })).toThrow(InvalidExpressionError);
      expect(() => evaluate('x 2', { x: 3 })).toThrow(InvalidExpressionError);
    });

    it('should name the variable in the missing-operator error message', () => {
      expect(() => evaluate('x2', { x: 3 })).toThrow('Missing operator between x and 2');
    });

    it('should apply implicit multiplication between a variable and a named constant, in both orders', () => {
      expect(evaluate('x PI', { x: 3 })).toBeCloseTo(3 * Math.PI, 10);
      expect(evaluate('PI x', { x: 3 })).toBeCloseTo(3 * Math.PI, 10);
    });

    it('should throw for xPI and PIx: no space means a single unknown symbol', () => {
      expect(() => evaluate('xPI', { x: 3 })).toThrow(InvalidExpressionError);
      expect(() => evaluate('PIx', { x: 3 })).toThrow(InvalidExpressionError);
    });

    it('should apply implicit multiplication between two variables', () => {
      expect(evaluate('x x', { x: 3 })).toBe(9);
      expect(evaluate('x y', { x: 3, y: 4 })).toBe(12);
    });

    it('should apply implicit multiplication between a variable and a bracketed group', () => {
      expect(evaluate('x(2+3)', { x: 2 })).toBe(10);
      expect(evaluate('(2+3)x', { x: 2 })).toBe(10);
    });

    it('should apply a PREFIX function to a variable without parentheses', () => {
      expect(evaluate('sin x', { x: 0 })).toBe(0);
    });

    it('should give implicit multiplication with variables the usual precedence', () => {
      // 2x^2 = 2*(x^2): implicit multiplication binds looser than ^
      expect(evaluate('2x^2', { x: 3 })).toBe(18);
      // 6/2x = 6/(2*x): implicit multiplication binds tighter than /
      expect(evaluate('6/2x', { x: 3 })).toBe(1);
    });
  });
});

describe('evaluateRpn() with variables', () => {
  it('should substitute a single variable', () => {
    expect(evaluateRpn('x 1 +', { x: 2 })).toBe(3);
  });

  it('should substitute multiple variables', () => {
    expect(evaluateRpn('x y 2 * +', { x: 1, y: 5 })).toBe(11);
  });

  it('should combine variables with named constants', () => {
    expect(evaluateRpn('x PI +', { x: 1 })).toBeCloseTo(1 + Math.PI, 10);
  });

  it('should keep working without a variables argument (no regression)', () => {
    expect(evaluateRpn('2 3 +')).toBe(5);
  });

  it('should throw InvalidExpressionError for an undeclared variable', () => {
    expect(() => evaluateRpn('x 1 +')).toThrow(InvalidExpressionError);
  });

  it('should throw InvalidExpressionError on collision with a built-in symbol', () => {
    expect(() => evaluateRpn('1 1 +', { PI: 5 })).toThrow(InvalidExpressionError);
  });

  it('should accept scientific-notation literals', () => {
    expect(evaluateRpn('4e2 2 +', {})).toBe(402);
    expect(evaluateRpn('2E3 2 *')).toBe(4000);
  });
});

describe('scientific notation', () => {
  it('should evaluate scientific literals, lowercase and uppercase', () => {
    expect(evaluate('4e-10')).toBe(4e-10);
    expect(evaluate('4E-10')).toBe(4e-10);
    expect(evaluate('2E5')).toBe(200000);
    expect(evaluate('1.5e3')).toBe(1500);
  });

  it('should combine scientific literals with operators', () => {
    expect(evaluate('2 + 1e3')).toBe(1002);
    expect(evaluate('1e-2 * 4e2')).toBe(4);
    expect(evaluate('sqrt(4e2)')).toBe(20);
  });

  it('should take part in implicit multiplication as a NUMBER', () => {
    expect(evaluate('2e3 PI')).toBeCloseTo(2000 * Math.PI, 8);
    expect(evaluate('1e-2 x', { x: 100 })).toBe(1);
  });

  it('should read 2E+3PI as (2E+3)*PI: the exponent absorbs the sign', () => {
    expect(evaluate('2E+3PI')).toBeCloseTo(2000 * Math.PI, 8);
  });

  it('should NOT treat e/E without exponent digits as scientific', () => {
    // with no E constant registered, a lone e/E is just an unknown symbol
    expect(() => evaluate('2e')).toThrow(InvalidExpressionError);
    expect(() => evaluate('2E')).toThrow(InvalidExpressionError);
    expect(() => evaluate('E')).toThrow(InvalidExpressionError);
  });
});

describe('underscore digit grouping', () => {
  it('should evaluate underscore-grouped numbers as one value', () => {
    expect(evaluate('1_000_000')).toBe(1000000);
    expect(evaluate('1_523_245.45')).toBe(1523245.45);
    expect(evaluate('1.000_001')).toBe(1.000001);
  });

  it('should combine a grouped number with variables and implicit multiplication', () => {
    expect(evaluate('2_000 x', { x: 3 })).toBe(6000);
    expect(evaluate('x + 1_000', { x: 1 })).toBe(1001);
  });

  it('should work the same in evaluateRpn', () => {
    expect(evaluateRpn('1_000 1 +')).toBe(1001);
  });

  it('should still reject two adjacent numbers without underscore between them', () => {
    // the underscore rule must not weaken the existing "2 3" adjacency error
    expect(() => evaluate('2 3')).toThrow(InvalidExpressionError);
  });
});

describe('exp operator (replaces the removed E constant)', () => {
  it('should compute the natural exponential', () => {
    expect(evaluate('exp 1')).toBeCloseTo(Math.E, 10);
    expect(evaluate('exp 2')).toBeCloseTo(Math.E ** 2, 10);
    expect(evaluate('exp(0)')).toBe(1);
    expect(evaluate('exp(-1)')).toBeCloseTo(1 / Math.E, 10);
  });

  it('should behave as a PREFIX function in implicit multiplication', () => {
    expect(evaluate('2 exp 1')).toBeCloseTo(2 * Math.E, 10);
    expect(evaluate('exp 1 + 1')).toBeCloseTo(Math.E + 1, 10);
  });
});

describe('reserved exponent letters e/E', () => {
  it('should reject e and E as variable names', () => {
    expect(() => evaluate('1 + 1', { e: 2 })).toThrow(InvalidExpressionError);
    expect(() => evaluate('1 + 1', { E: 2 })).toThrow(InvalidExpressionError);
    expect(() => evaluate('1 + 1', { e: 2 })).toThrow(/exponent notation/);
  });

  it('should still accept other single-letter variable names', () => {
    expect(evaluate('a + b', { a: 1, b: 2 })).toBe(3);
  });
});

describe('compile()', () => {
  it('should return a reusable function evaluated with different values', () => {
    const p = compile('x ^ 2 + y ^ 2');
    expect(p({ x: 3, y: 4 })).toBe(25);
    expect(p({ x: 5, y: 12 })).toBe(169);
    expect(p({ x: 0, y: 0 })).toBe(0);
  });

  it('should evaluate a constant expression with no variables', () => {
    const c = compile('2 + 3 * 5');
    expect(c()).toBe(17);
    expect(c({})).toBe(17);
  });

  it('should give the same result as the equivalent evaluate() call', () => {
    expect(compile('x + y * 2')({ x: 1, y: 5 })).toBe(evaluate('x + y * 2', { x: 1, y: 5 }));
    expect(compile('PI * r ^ 2')({ r: 2 })).toBe(evaluate('PI * r ^ 2', { r: 2 }));
  });

  it('should support implicit multiplication, functions and constants', () => {
    expect(compile('2x')({ x: 3 })).toBe(6);
    expect(compile('sin(x) + max(y, 1)')({ x: 0, y: 5 })).toBe(5);
    expect(compile('x PI')({ x: 2 })).toBeCloseTo(2 * Math.PI, 10);
  });

  it('should parse eagerly: a malformed expression throws at compile time', () => {
    expect(() => compile('3 + 4)')).toThrow(InvalidExpressionError);
    expect(() => compile('')).toThrow(InvalidExpressionError);
    expect(() => compile('e + 1')).toThrow(InvalidExpressionError);
  });

  it('should not need variable values until it is called', () => {
    const f = compile('x + y'); // compiles fine with free variables
    expect(() => f({ x: 1 })).toThrow(InvalidExpressionError); // missing y at call time
    expect(() => f({ x: 1 })).toThrow(/y/);
    expect(f({ x: 1, y: 2 })).toBe(3);
  });

  it('should reject colliding or malformed variable names at call time', () => {
    expect(() => compile('x + 1')({ PI: 5 })).toThrow(InvalidExpressionError);
    expect(() => compile('x + 1')({ x2: 5 })).toThrow(InvalidExpressionError);
  });

  it('should throw ValueError for out-of-domain operands when called', () => {
    expect(() => compile('x / 0')({ x: 1 })).toThrow(ValueError);
    expect(() => compile('sqrt(x)')({ x: -1 })).toThrow(ValueError);
  });

  it('should not carry state between calls', () => {
    const f = compile('x + 1');
    f({ x: 100 });
    expect(f({ x: 1 })).toBe(2);
  });
});
