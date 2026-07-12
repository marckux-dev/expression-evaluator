import { OperatorEntity, OperatorPosition } from '../../domain/entities';
import { TokenMapper } from '../mappers';
import { CompileStandardExpressionUsecase } from './compile-standard-expression.usecase';

/** Prefix-function precedence, shared with the built-ins `sin`/`sqrt`/`max`. */
const USER_FUNCTION_PRECEDENCE = 85;

/**
 * Turns a compiled expression into a named, reusable **prefix operator** —
 * a user-defined function. After
 * `new DefineFunctionUsecase().execute('P', ['x'], '2 x + 1')`, the symbol
 * `P` is a first-class token: it composes (`Q(x) := sin(P(x))`), combines
 * (`K(x) := P(x) + Q(x)`) and nests inside built-ins, because to the parser
 * it is just another prefix operator like `sin`.
 *
 * It ties together the two extension points of the library: the body is
 * compiled once with {@link CompileStandardExpressionUsecase}, and the
 * result is registered as a factory via
 * {@link TokenMapper.registerFactory} with a fixed `arity` equal to the
 * number of parameters.
 *
 * ```ts
 * const define = new DefineFunctionUsecase();
 * define.execute('hyp', ['x', 'y'], 'sqrt(x ^ 2 + y ^ 2)');
 * evaluate('hyp(3, 4)'); // 5
 * ```
 *
 * Two behaviours worth knowing:
 *
 * - **Definition is process-global.** {@link TokenMapper} is a singleton, so
 *   the function is visible to every later evaluation anywhere in the
 *   process (and re-defining a name replaces the previous one).
 * - **The body is captured at definition time.** If `Q`'s body uses `P`,
 *   `Q` keeps the `P` that existed when `Q` was defined; a later redefinition
 *   of `P` does not change an already-defined `Q`.
 *
 * This usecase performs no validation yet: it does not stop you from
 * shadowing a built-in, using a parameter name that collides with a token,
 * or defining a recursive function (which would overflow the stack when
 * evaluated). Those checks are layered on separately.
 */
export class DefineFunctionUsecase {
  /**
   * Compiles `body` once and registers `name` as a prefix operator of
   * `params.length` operands.
   *
   * Operands are popped from the evaluation stack in reverse order, so they
   * are reversed back before being bound to `params` positionally: for
   * `sub(x, y) := x - y`, `sub(10, 3)` binds `x = 10`, `y = 3`.
   *
   * @param name the symbol the function is invoked by (word-shaped, e.g.
   *   `hyp`; avoid trailing digits, which the tokenizer splits off).
   * @param params the parameter names, in order; their count fixes the
   *   operator's arity.
   * @param body the expression to evaluate, using `params` as free
   *   variables (plus any constants or previously defined functions).
   * @throws {InvalidExpressionError} if `body` is malformed, or (at call
   *   time) if it references a free variable that is not one of `params`.
   */
  execute(name: string, params: string[], body: string): void {
    const compiledExpression = new CompileStandardExpressionUsecase().execute(
      body
    );
    TokenMapper.getInstance().registerFactory(
      name,
      () =>
        new OperatorEntity({
          symbol: name,
          arity: params.length,
          precedence: USER_FUNCTION_PRECEDENCE,
          position: OperatorPosition.PREFIX,
          operation: (...operands: number[]) => {
            const values = operands.reverse();
            const variables: Record<string, number> = {};
            params.forEach((p, i) => {
              variables[p] = values[i];
            });
            return compiledExpression(variables);
          },
        })
    );
  }
}
