import {EvaluateStandardExpressionUsecase} from "./evaluate-standard-expression.usecase";

// Target behavior for implicit multiplication (not implemented yet). These
// tests are expected to fail today; they document the desired semantics for
// the feature discussed in ANALISIS.md §6.
const evaluator = new EvaluateStandardExpressionUsecase();

describe('implicit multiplication (not yet implemented)', () => {

  it('number immediately followed by a constant', () => {
    const examples = [
      { input: '2PI', expected: 2 * Math.PI },
      { input: '3E', expected: 3 * Math.E },
      { input: '10PI', expected: 10 * Math.PI },
    ];
    examples.forEach(example => {
      expect(evaluator.execute(example.input)).toBeCloseTo(example.expected);
    });
  });

  it('number immediately followed by an opening bracket', () => {
    const examples = [
      { input: '2(3+4)', expected: 14 },
      { input: '5(1-1)', expected: 0 },
      { input: '3(1+2)', expected: 9 },
    ];
    examples.forEach(example => {
      expect(evaluator.execute(example.input)).toBe(example.expected);
    });
  });

  it('a closing bracket immediately followed by a number', () => {
    expect(evaluator.execute('(1+2)3')).toBe(9);
  });

  it('a closing bracket immediately followed by an opening bracket', () => {
    expect(evaluator.execute('(1+2)(3+4)')).toBe(21);
  });

  it('a constant immediately followed by an opening bracket', () => {
    expect(evaluator.execute('PI(2+3)')).toBeCloseTo(5 * Math.PI);
  });

  it('a closing bracket immediately followed by a constant', () => {
    expect(evaluator.execute('(2+3)PI')).toBeCloseTo(5 * Math.PI);
  });

  it('a number followed by a PREFIX function, with or without a space', () => {
    const examples = [
      { input: '2sqrt(4)', expected: 4 },
      { input: '2 sqrt(4)', expected: 4 },
      { input: '2 sin (PI/2)', expected: 2 },
    ];
    examples.forEach(example => {
      expect(evaluator.execute(example.input)).toBeCloseTo(example.expected);
    });
  });

  it('a number and a constant separated only by whitespace', () => {
    expect(evaluator.execute('2 PI')).toBeCloseTo(2 * Math.PI);
  });

  it('implicit multiplication inside a PREFIX function argument', () => {
    // sin 2 PI + 1  ===  sin(2 * PI) + 1
    expect(evaluator.execute('sin 2 PI + 1')).toBeCloseTo(Math.sin(2 * Math.PI) + 1);
  });

  it('implicit multiplication combined with explicit operators respects precedence', () => {
    const examples = [
      { input: '1 + 2PI', expected: 1 + 2 * Math.PI },
      { input: '2PI/3E', expected: (2 * Math.PI) / (3 * Math.E) },
      // '^' (95) binds tighter than implicit '*' (20): 2*(PI^2), not (2*PI)^2
      { input: '2PI^2', expected: 2 * Math.pow(Math.PI, 2) },
    ];
    examples.forEach(example => {
      expect(evaluator.execute(example.input)).toBeCloseTo(example.expected);
    });
  });

  it('implicit multiplication between two chained PREFIX function results', () => {
    // sin PI cos 0  ===  sin(PI) * cos(0)
    expect(evaluator.execute('sin PI cos 0')).toBeCloseTo(Math.sin(Math.PI) * Math.cos(0));
  });

  it('does not break a number followed by a parenthesized negative number', () => {
    expect(evaluator.execute('2(-3)')).toBe(-6);
  });

  it('does NOT apply implicit multiplication between two adjacent number literals', () => {
    // '23' is a single numeric token (tokenizer merges digit sequences),
    // never 2 * 3. This is a non-goal, documented here as a guard rail.
    expect(evaluator.execute('23')).toBe(23);
  });

});
