import {EvaluateStandardExpressionUsecase} from "./evaluate-standard-expression.usecase";
import {InvalidExpressionError, ValueError} from "../../domain/entities/errors";

const evaluator = new EvaluateStandardExpressionUsecase();

describe('evaluate-standard-expression.usecase', () => {

  it ('should evaluate a expression with only one number or constant', () => {
    const examples = [
      {
        input: '2',
        expected: 2
      },
      {
        input: 'PI',
        expected: Math.PI
      }
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it ('should evaluate a expression with single operator', () => {
    const examples = [
      {
        input: '2+3',
        expected: 5
      },
      {
        input: '2-3',
        expected: -1
      },
      {
        input: '2*3',
        expected: 6
      },
      {
        input: '2/3',
        expected: 2 / 3
      },
      {
        input: '2^3',
        expected: 8
      },
      {
        input: '-7',
        expected: -7
      }
    ];
    examples.forEach(example=>{
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should evaluate the input correctly', () => {
    const input: string = '2 + 3 * 5 - 6 * 2 + 1';
    const result = evaluator.execute(input);
    expect(result).toBe(6);
  });
  it ('should evaluate expression with brackets', () => {
    const input: string = 'neg (2 + 3) * 5';
    const result = evaluator.execute(input);
    expect(result).toBe(-25);
  });
  it ('should evaluate a complex expression', () => {
    const input: string = '(neg (1 + 2 + 3) * neg 5 * 2 - 1) / 59';
    const result = evaluator.execute(input);
    expect(result).toBe(1);
  });

  it ('should evaluate a expression with negative numbers', () => {
    const input: string = '2 + (-3) * 5 - (-6 +1)';
    const result = evaluator.execute(input);
    expect(result).toBe(-8);
  })

  it ('should evaluate a expression with decimal numbers', () => {
    const input: string = '2.5 + 3.5 * 2 - 1.75';
    const result = evaluator.execute(input);
    expect(result).toBe(7.75);
  });

  it('should evaluate underscore-grouped numbers (JS-style digit separators)', () => {
    const examples = [
      { input: '1_000_000', expected: 1000000 },
      { input: '1_523_245.45', expected: 1523245.45 },
      { input: '1.000_001', expected: 1.000001 },
      { input: '1_000 + 2_000', expected: 3000 },
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should evaluate a expression with a function with undefined number of operands', () => {
    const input: string = 'max (1, 2, 5, -2, 3)';
    const result = evaluator.execute(input);
    expect(result).toBe(5);
  });

  it('should isolate variadic arguments that contain operators (comma flushes them)', () => {
    const examples = [
      { input: 'max(2*PI, 3*exp(1))', expected: 3 * Math.E },
      { input: 'max(1+1, 2*3)', expected: 6 },
      { input: 'max(2*3, 1+1)', expected: 6 },
      { input: 'max(2^2, 3^2)', expected: 9 },
      { input: 'max(2*(3+4), 5*6)', expected: 30 },
      { input: 'max(max(1,2), 3)', expected: 3 },
      { input: 'max(1, -2, 3*(-2))', expected: 1 },
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBeCloseTo(example.expected, 10);
    });
  });

  it('should evaluate a expression with a postfix operator', () => {
    const input: string = '5!';
    const result = evaluator.execute(input);
    expect(result).toBe(120);
  });

  it('should evaluate a expression with a postfix operator and brackets', () => {
    const input: string = '(2+3)!+7';
    const result = evaluator.execute(input);
    expect(result).toBe(127);
  });

  it('should evaluate a expression with two operands with same precedence and right associativity', () => {
    const examples = [
      {
        input: '2^3^2',
        expected: 512
      },
      {
        input: '3!^2',
        expected: 36
      },
      {
        input: '2^3!',
        expected: 64
      }
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should treat binary +/- after a postfix operator as binary', () => {
    const examples = [
      {
        input: '5! - 3',
        expected: 117
      },
      {
        input: '3! + 4',
        expected: 10
      }
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should implicitly close unclosed opening brackets at the end of the expression', () => {
    const examples = [
      {
        input: '3-(2*(3+4',
        expected: -11
      },
      {
        input: '(((1+2',
        expected: 3
      },
      {
        input: '2*(3+4!',
        expected: 54
      }
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should throw InvalidExpressionError for an extra closing bracket', () => {
    expect(() => evaluator.execute('3+4)')).toThrow(InvalidExpressionError);
  });

  it('should throw InvalidExpressionError for an empty or blank expression', () => {
    expect(() => evaluator.execute('')).toThrow(InvalidExpressionError);
    expect(() => evaluator.execute('   ')).toThrow(InvalidExpressionError);
  });

  it('should throw ValueError for out-of-domain operands', () => {
    expect(() => evaluator.execute('10 / 0')).toThrow(ValueError);
    expect(() => evaluator.execute('sqrt(-1)')).toThrow(ValueError);
    expect(() => evaluator.execute('(-3)!')).toThrow(ValueError);
    expect(() => evaluator.execute('max()')).toThrow(ValueError);
  });

  it ('should evaluate a expression with trigonometric functions', () => {
    const examples = [
      {
        input: 'cos PI',
        expected: -1
      },
      {
        input: 'cos sin PI',
        expected: 1
      },
      {
        input: 'sin (PI/2)',
        expected: 1
      }
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should chain PREFIX functions of the same kind without parentheses', () => {
    const examples = [
      { input: 'sqrt sqrt 16', expected: 2 },
      { input: 'sqrt sqrt sqrt 256', expected: 2 },
      { input: 'sin sin 0', expected: 0 },
      { input: 'cos cos 0', expected: Math.cos(Math.cos(0)) },
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should chain different PREFIX functions without parentheses', () => {
    const examples = [
      { input: 'sqrt sin (PI/2)', expected: 1 },
      { input: 'sqrt cos 0', expected: 1 },
      { input: 'sin sqrt 0', expected: 0 },
      { input: 'cos sqrt 0', expected: 1 },
      { input: 'sqrt sqrt cos 0', expected: 1 },
    ];
    examples.forEach(example => {
      const result = evaluator.execute(example.input);
      expect(result).toBe(example.expected);
    });
  });

  it('should evaluate a chained PREFIX function the same with or without parentheses', () => {
    expect(evaluator.execute('sqrt sqrt 16')).toBe(evaluator.execute('sqrt(sqrt(16))'));
    expect(evaluator.execute('sqrt cos 0')).toBe(evaluator.execute('sqrt(cos(0))'));
    expect(evaluator.execute('cos sin PI')).toBe(evaluator.execute('cos(sin(PI))'));
  });

});