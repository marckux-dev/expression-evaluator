import { StandardExpressionBuilder } from '../builders/standard.expression.builder';
import { ExpressionBuilder } from '../builders';
import { ExpressionEntity, VariableEntity } from '../../domain/entities';
import { InvalidExpressionError } from '../../domain/entities/errors';

/**
 * A parsed expression ready to be evaluated repeatedly. Call it with a
 * mapping of variable names to values; call it as many times as you like
 * with different values without re-parsing.
 *
 * `variables` lists the free variable names the expression uses (in first
 * appearance order, deduplicated), so callers can know its inputs without
 * re-parsing the source — a dependency graph, a form generator or an
 * argument validator can be built directly from it.
 *
 * @throws {InvalidExpressionError} if a supplied name is malformed or
 *   collides with a token, or if a variable used by the expression has no
 *   value in this call.
 * @throws {ValueError} if an operand is out of an operator's domain.
 */
export type CompiledExpression = ((variables?: Record<string, number>) => number) & {
  /** Free variable names of the expression, deduplicated. */
  readonly variables: string[];
};

/**
 * Compiles a standard (infix) expression once and returns a
 * {@link CompiledExpression} that evaluates it against different variable
 * values on each call — "parse once, evaluate many". It is the deferred
 * counterpart of {@link EvaluateStandardExpressionUsecase}: same pipeline
 * (tokenize, implicit multiplication, unary/binary overload, RPN), but the
 * variable values are bound per invocation instead of up front.
 *
 * ```ts
 * const p = new CompileStandardExpressionUsecase().execute('x ^ 2 + y ^ 2');
 * p({ x: 3, y: 4 }); // 25
 * p({ x: 5, y: 12 }); // 169
 * ```
 *
 * Parsing is eager: a malformed expression throws from `execute()`, before
 * any invocation. Errors that depend on the actual values — a missing
 * variable, an out-of-domain operand — surface when the compiled
 * expression is called.
 */
export class CompileStandardExpressionUsecase {

  /**
   * Parses `expression` into a reusable {@link CompiledExpression}.
   *
   * @throws {InvalidExpressionError} if the expression is malformed
   *   (unknown non-identifier symbol, unbalanced brackets, empty…). Free
   *   variables are allowed — their values are supplied at call time.
   */
  execute(expression: string): CompiledExpression {
    // Build the RPN token sequence a single time. Unknown identifiers stay
    // as unbound variables; no variable values are needed yet.
    const compiled: ExpressionEntity = new StandardExpressionBuilder(expression)
      .tokenize()
      .manageImplicitMultiplication()
      .manageOperatorOverload()
      .toRpn()
      .build();

    // Empty input parses to zero tokens without failing in the chain above;
    // reject it here so the mistake surfaces at compile time, not on call.
    if (compiled.getTokens().length === 0) {
      throw new InvalidExpressionError('The expression is empty');
    }

    // Free variables: the tokenizer turned every identifier that is not a
    // registered token into an (unbound) VariableEntity.
    const variables = [
      ...new Set(
        compiled
          .getTokens()
          .filter((token): token is VariableEntity => token instanceof VariableEntity)
          .map((token) => token.getSymbol())
      ),
    ];

    const call = (values: Record<string, number> = {}) => {
      // Validate the supplied names on every call (collisions with tokens,
      // reserved e/E, malformed names): bind() alone would ignore them.
      ExpressionBuilder.validateVariablesCollision(values);
      return compiled.bind(values).getValue();
    };
    return Object.assign(call, { variables });
  }
}
