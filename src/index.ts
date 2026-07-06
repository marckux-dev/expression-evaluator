// Public API

// Evaluators
export { EvaluateStandardExpressionUsecase } from './application/usecases/evaluate-standard-expression.usecase';
export { EvaluateRpnExpressionUsecase } from './application/usecases/evaluate-rpn-expression.usecase';
export { EvaluatorInterface } from './application/usecases/evaluator.interface';

// Errors
export { InvalidExpressionError, ValueError } from './domain/entities/errors';

// Extension points: custom operators and constants
export {
  OperatorEntity,
  OperatorEntityOptions,
  OperatorPosition,
  OperatorAssociativity,
  ConstantEntity,
  TokenInterface,
} from './domain/entities';
export { TokenMapper } from './application/mappers';

import { EvaluateStandardExpressionUsecase } from './application/usecases/evaluate-standard-expression.usecase';
import { EvaluateRpnExpressionUsecase } from './application/usecases/evaluate-rpn-expression.usecase';

/**
 * Evaluates a math expression in standard (infix) notation.
 *
 * @example
 * evaluate('3 + 4 * (2 - 1)'); // 7
 * evaluate('sin(PI / 2) + max(1, 5, 3)'); // 6
 *
 * @throws {InvalidExpressionError} if the expression is malformed.
 * @throws {ValueError} if an operand is out of an operator's domain.
 */
export function evaluate(expression: string): number {
  return new EvaluateStandardExpressionUsecase().execute(expression);
}

/**
 * Evaluates a math expression in reverse Polish notation (RPN).
 * Tokens must be separated by spaces.
 *
 * @example
 * evaluateRpn('3 4 2 1 - * +'); // 7
 *
 * @throws {InvalidExpressionError} if the expression is malformed.
 * @throws {ValueError} if an operand is out of an operator's domain.
 */
export function evaluateRpn(expression: string): number {
  return new EvaluateRpnExpressionUsecase().execute(expression);
}
