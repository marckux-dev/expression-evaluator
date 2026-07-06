import {EvaluateRpnExpressionUsecase} from "./evaluate-rpn-expression.usecase";
import {InvalidExpressionError} from "../../domain/entities/errors";

describe('Evaluate RPN Expression Use Case', () => {
  it('should evaluate the input correctly', () => {
    const input: string = '5 2 + 3*';
    const evaluator = new EvaluateRpnExpressionUsecase();
    const result = evaluator.execute(input);
    expect(result).toBe(21);
  });
  it('should evaluate a very complex input correctly', () => {
    const input: string = '5.3 2.7 + 3 * 4 2 / +';
    const evaluator = new EvaluateRpnExpressionUsecase();
    const result = evaluator.execute(input);
    expect(result).toBe(26);
  });

  it('should throw InvalidExpressionError when the expression contains brackets', () => {
    const evaluator = new EvaluateRpnExpressionUsecase();
    expect(() => evaluator.execute('3 ( +')).toThrow(InvalidExpressionError);
    expect(() => evaluator.execute('3 4 + )')).toThrow(InvalidExpressionError);
  });

  it('should throw InvalidExpressionError when the expression contains a comma', () => {
    const evaluator = new EvaluateRpnExpressionUsecase();
    expect(() => evaluator.execute('3 , 4 +')).toThrow(InvalidExpressionError);
  });
});