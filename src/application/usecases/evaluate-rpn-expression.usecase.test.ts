import {EvaluateRpnExpressionUseCase} from "./evaluate-rpn-expression.usecase";

describe('Evaluate RPN Expression Use Case', () => {
  it('should evaluate the input correctly', () => {
    const input: string = '5 2 + 3*';
    const evaluator = new EvaluateRpnExpressionUseCase();
    const result = evaluator.execute(input);
    expect(result).toBe(21);
  });
  it('should evaluate a very complex input correctly', () => {
    const input: string = '5.3 2.7 + 3 * 4 2 / +';
    const evaluator = new EvaluateRpnExpressionUseCase();
    const result = evaluator.execute(input);
    expect(result).toBe(26);
  });
});