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

// User-defined functions: register a named prefix operator from an expression
export { DefineFunctionUsecase } from './application/usecases/define-function.usecase';

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
  // The single source of truth for what a valid variable/identifier looks
  // like, so consumers can pre-validate names the same way the parser does.
  VARIABLE_NAME_PATTERN,
} from './domain/entities';
export { TokenMapper } from './application/mappers';

import { EvaluateStandardExpressionUsecase } from './application/usecases/evaluate-standard-expression.usecase';
import { EvaluateRpnExpressionUsecase } from './application/usecases/evaluate-rpn-expression.usecase';
import {
  CompileStandardExpressionUsecase,
  CompiledExpression,
} from './application/usecases/compile-standard-expression.usecase';
import { DefineFunctionUsecase } from './application/usecases/define-function.usecase';
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
 * Defines a reusable function from an expression and registers it as a named
 * prefix operator, so it can be used in later expressions exactly like a
 * built-in (`sin`, `sqrt`). The body is parsed once; `params` are its inputs,
 * bound positionally on each call. Functions compose and combine freely
 * (`f(g(x))`, `p(x) + q(x)`) because to the parser they are ordinary
 * operators.
 *
 * The definition is **process-global** (registered in the shared
 * {@link TokenMapper}) and re-defining a name replaces the previous one. A
 * function's body captures the definitions in scope at definition time, so
 * redefining a dependency does not alter functions already defined.
 *
 * @param name The symbol the function is called by. Use a word (letters),
 *   without trailing digits — the tokenizer splits `f2` into `f` and `2`.
 * @param params The parameter names, in order; their count is the arity.
 * @param body The expression to evaluate, using `params` as its variables
 *   (plus constants and any previously defined functions).
 *
 * @example
 * defineFunction('hyp', ['x', 'y'], 'sqrt(x ^ 2 + y ^ 2)');
 * evaluate('hyp(3, 4)'); // 5
 *
 * defineFunction('dbl', ['x'], '2 x');
 * defineFunction('f', ['x'], 'dbl(x) + 1');
 * evaluate('f(5)'); // 11
 *
 * @throws {InvalidExpressionError} if the body is malformed. Errors that
 *   depend on the arguments (a free variable not in `params`, an
 *   out-of-domain operand) surface when the function is called.
 */
export function defineFunction(name: string, params: string[], body: string): void {
  return new DefineFunctionUsecase().execute(name, params, body);
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
