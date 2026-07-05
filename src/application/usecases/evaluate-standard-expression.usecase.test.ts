import {EvaluateStandardExpressionUsecase} from "./evaluate-standard-expression.usecase";

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

  it('should evaluate a expression with a function with undefined number of operands', () => {
    const input: string = 'max (1, 2, 5, -2, 3)';
    const result = evaluator.execute(input);
    expect(result).toBe(5);
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

});