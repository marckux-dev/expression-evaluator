import {
  ConstantEntity,
  ExpressionEntity,
  TokenInterface,
  VariableEntity,
  VARIABLE_NAME_PATTERN,
} from '../../domain/entities';
import { FormatterUsecase } from '../usecases/formatter.usecase';
import { TokenMapper } from '../mappers';
import { InvalidExpressionError } from '../../domain/entities/errors';

/**
 * Turns a raw expression string into an {@link ExpressionEntity}. This base
 * builder assumes the tokens are already in evaluation (RPN) order; for
 * infix input use {@link StandardExpressionBuilder}, which adds the
 * conversion steps.
 */
export class ExpressionBuilder {
  protected tokens: TokenInterface[] = [];

  /**
   * @param expression The raw expression string to parse.
   * @param variables Maps variable names to their numeric values; every
   *   occurrence of a name in the expression is substituted during
   *   tokenization. Validated up front against the registered tokens.
   *
   * @throws {InvalidExpressionError} if a variable name collides with a
   *   registered operator/constant, or is the reserved `e`/`E`.
   */
  constructor(
    private expression: string,
    private variables: Record<string, number> = {},
  ) {
    ExpressionBuilder.validateVariablesCollision(variables);
    this.expression = expression;
    this.variables = variables;
  }

  public getTokens(): TokenInterface[] {
    return this.tokens.slice();
  }

  /**
   * Rejects variable names that are not shaped like an identifier
   * ({@link VARIABLE_NAME_PATTERN}), collide with a symbol registered in
   * the {@link TokenMapper}, or are the reserved exponent letters `e`/`E`
   * (part of numeric literals like `2e5`). The whole mapping is checked,
   * even names the expression never uses: a bad name would otherwise
   * never match any token and be ignored silently.
   *
   * @throws {InvalidExpressionError} if a name is invalid or collides.
   */
  public static validateVariablesCollision(
    variables: Record<string, number>
  ): void {
    const variablesNames: string[] = Object.keys(variables);
    variablesNames.forEach((v) => {
      if (v === 'e' || v === 'E')
        throw new InvalidExpressionError(
          `Variable "${v}" is not allowed: "e" and "E" are part of the numeric exponent notation (2e5).`
        );
      ExpressionBuilder.validateVariableName(v);
      if (TokenMapper.getInstance().has(v))
        throw new InvalidExpressionError(
          `Variable "${v}" collides with an existing operator or constant.`
        );
    });
  }

  /**
   * Rejects a name that does not match {@link VARIABLE_NAME_PATTERN}: an
   * optional leading `_` or `$`, at least one letter, and an optional
   * `_`-separated numeric suffix (`x`, `_x`, `$x`, `x_12`, `_abc_123`).
   *
   * @throws {InvalidExpressionError} if the variable name is invalid.
   */
  private static validateVariableName(variableName: string): void {
    if (!VARIABLE_NAME_PATTERN.test(variableName))
      throw new InvalidExpressionError(
        `"${variableName}" is not a valid variable name: an optional leading "_" or "$", letters, and an optional "_"-separated numeric suffix (like "x_2").`
      );
  }

  /**
   * Splits the formatted expression and maps each piece to a token:
   * numeric literals become {@link ConstantEntity}, anything else is looked
   * up in the {@link TokenMapper} (which throws for unknown symbols).
   */
  public tokenize(): this {
    const formatter = new FormatterUsecase();
    const formattedExpression = formatter.execute(this.expression);
    const stringTokens = formattedExpression
      .split(' ')
      .filter((symbol) => symbol !== '');
    this.tokens = stringTokens.map((symbol) => this.resolveSymbol(symbol));
    return this;
  }

  /**
   * Resolves one string piece to a token: a numeric literal becomes a
   * {@link ConstantEntity}, a name present in the variables mapping becomes
   * a bound {@link VariableEntity}, a registered symbol is looked up in the
   * {@link TokenMapper}, and any other identifier-shaped word becomes an
   * **unbound** {@link VariableEntity} — to be given a value later through
   * `ExpressionEntity.bind()` (this is what `compile()` relies on).
   *
   * @throws {InvalidExpressionError} if the symbol is none of the above:
   *   not a number, not registered, and not shaped like a variable name
   *   (including the reserved `e`/`E`, which never become variables).
   */
  private resolveSymbol(symbol: string): TokenInterface {
    if (!isNaN(Number(symbol))) {
      return new ConstantEntity(Number(symbol));
    } else if (Object.prototype.hasOwnProperty.call(this.variables, symbol)) {
      return new VariableEntity(symbol, Number(this.variables[symbol]));
    } else {
      try {
        return TokenMapper.getInstance().getToken(symbol);
      } catch (error) {
        // e/E are reserved for the exponent notation: keep the original
        // "not a valid operator" error instead of turning them into variables
        if (symbol === 'e' || symbol === 'E') throw error;
        ExpressionBuilder.validateVariableName(symbol);
        return new VariableEntity(symbol);
      }
    }
  }

  public build(): ExpressionEntity {
    return new ExpressionEntity(this.tokens);
  }
}
