// Public API

// Evaluators
export { EvaluateStandardExpressionUsecase } from './application/usecases/evaluate-standard-expression.usecase';
export { EvaluateRpnExpressionUsecase } from './application/usecases/evaluate-rpn-expression.usecase';
export { EvaluatorInterface } from './application/usecases/evaluator.interface';

// Compilation: parse once, evaluate many
export {
  CompileStandardExpressionUsecase,
  CompiledExpression,
} from './application/usecases/compile-standard-expression.usecase';

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
import {
  CompileStandardExpressionUsecase,
  CompiledExpression,
} from './application/usecases/compile-standard-expression.usecase';
import { FormatNumberUsecase } from './application/usecases/format-number.usecase';

/**
 * Evaluates a math expression in standard (infix) notation.
 *
 * @param expression The expression to evaluate.
 * @param variables Optional values for the variables the expression uses,
 *   bound per call — nothing is registered globally. A variable that ends
 *   up without a value makes the evaluation throw, naming it.
 *
 * @example
 * evaluate('3 + 4 * (2 - 1)'); // 7
 * evaluate('sin(PI / 2) + max(1, 5, 3)'); // 6
 * evaluate('2x + y', { x: 3, y: 1 }); // 7
 *
 * @throws {InvalidExpressionError} if the expression is malformed, or a
 *   variable it uses has no value.
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
 * Compiles a standard (infix) expression once and returns a function that
 * evaluates it against different variable values — "parse once, evaluate
 * many". Ideal when the same formula runs repeatedly (a parametric curve,
 * a pricing rule, a spreadsheet cell): the tokenizing and RPN conversion
 * happen a single time, and each call only substitutes values.
 *
 * Free variables need no values at compile time; supply them per call.
 * Parsing is eager, so a malformed expression throws here, right away; a
 * missing variable value or an out-of-domain operand throws when the
 * compiled function is called.
 *
 * @example
 * const p = compile('x ^ 2 + y ^ 2');
 * p({ x: 3, y: 4 });  // 25
 * p({ x: 5, y: 12 }); // 169
 *
 * const area = compile('PI * r ^ 2');
 * area({ r: 2 }); // 12.566…
 *
 * @throws {InvalidExpressionError} if the expression is malformed.
 */
export function compile(expression: string): CompiledExpression {
  return new CompileStandardExpressionUsecase().execute(expression);
}

/**
 * Formats a number for display. With no parameters it applies no rounding
 * at all (`value.toString()`); passing `maxDecimals` and/or
 * `maxSignificantDigits` opts into that specific rounding, e.g. collapsing
 * floating-point noise (`Math.sin(Math.PI)` → `0` with `maxDecimals`) while
 * keeping legitimately small or large values readable. Purely a
 * presentation helper: `evaluate()` and `evaluateRpn()` never round — pass
 * their result through this function only when you are about to show it to
 * a user.
 *
 * @param value The number to format, typically the result of `evaluate()`.
 * @param maxDecimals Decimal places below which a value collapses to `0`. Omit to disable.
 * @param maxSignificantDigits Significant digits kept in the output. Omit to disable.
 *
 * @example
 * formatNumber(Math.sin(Math.PI));      // '1.2246467991473532e-16'
 * formatNumber(Math.sin(Math.PI), 12);  // '0'
 * formatNumber(2e-10);                  // '2e-10'
 * formatNumber(Math.PI, 2);             // '3.14'
 */
export function formatNumber(value: number, maxDecimals?: number, maxSignificantDigits?: number): string {
  return new FormatNumberUsecase(maxDecimals, maxSignificantDigits).execute(value);
}
