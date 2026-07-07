// Public API

// Evaluators
export { EvaluateStandardExpressionUsecase } from './application/usecases/evaluate-standard-expression.usecase';
export { EvaluateRpnExpressionUsecase } from './application/usecases/evaluate-rpn-expression.usecase';
export { EvaluatorInterface } from './application/usecases/evaluator.interface';

// Display formatting (not used internally: evaluate()/evaluateRpn() always
// return full precision; rounding is opt-in, for presentation only)
export { FormatNumberUsecase } from './application/usecases/format-number.usecase';

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
import { FormatNumberUsecase } from './application/usecases/format-number.usecase';

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
export function evaluate(expression: string, variables?: Record<string, number>): number {
  return new EvaluateStandardExpressionUsecase().execute(expression, variables);
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
export function evaluateRpn(expression: string, variables?: Record<string, number>): number {
  return new EvaluateRpnExpressionUsecase().execute(expression, variables);
}

/**
 * Formats a number for display, rounding away floating-point noise
 * (`Math.sin(Math.PI)` → `0`) while keeping legitimately small or large
 * values readable. Purely a presentation helper: `evaluate()` and
 * `evaluateRpn()` never round — pass their result through this function
 * only when you are about to show it to a user.
 *
 * @param value The number to format, typically the result of `evaluate()`.
 * @param maxDecimals Decimal places below which a value collapses to `0`.
 * @param maxSignificantDigits Significant digits kept in the output.
 *
 * @example
 * formatNumber(Math.sin(Math.PI));  // '0'
 * formatNumber(2e-10);              // '2e-10'
 * formatNumber(Math.PI, 2);         // '3.14'
 */
export function formatNumber(value: number, maxDecimals?: number, maxSignificantDigits?: number): string {
  return new FormatNumberUsecase(maxDecimals, maxSignificantDigits).execute(value);
}
