import {
  ConstantEntity,
  ExpressionEntity,
  TokenInterface,
  VariableEntity,
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
    private variables: Record<string, number> = {}
  ) {
    ExpressionBuilder.validateVariablesCollision(variables);
    this.expression = expression;
    this.variables = variables;
  }

  public getTokens(): TokenInterface[] {
    return this.tokens.slice();
  }

  /**
   * Rejects variable names that collide with a symbol registered in the
   * {@link TokenMapper}, or with the reserved exponent letters `e`/`E`
   * (part of numeric literals like `2e5`). The whole mapping is checked,
   * even names the expression never uses: a collision is a programming
   * error worth failing fast on.
   *
   * @throws {InvalidExpressionError} if there is a collision.
   */
  private static validateVariablesCollision(
    variables: Record<string, number>
  ): void {
    const variablesNames: string[] = Object.keys(variables);
    variablesNames.forEach((v) => {
      if (v === 'e' || v === 'E')
        throw new InvalidExpressionError(
          `Variable "${v}" is not allowed: "e" and "E" are part of the numeric exponent notation (2e5).`
        );
      if (TokenMapper.getInstance().has(v))
        throw new InvalidExpressionError(
          `Variable "${v}" collides with an existing operator or constant.`
        );
    });
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
   * a {@link VariableEntity} (already carrying its value), and anything
   * else is looked up in the {@link TokenMapper}.
   *
   * @throws {InvalidExpressionError} if the symbol is not a number, a
   *   provided variable, or a registered token.
   */
  private resolveSymbol(symbol: string): TokenInterface {
    if (!isNaN(Number(symbol))) {
      return new ConstantEntity(Number(symbol));
    } else if (Object.prototype.hasOwnProperty.call(this.variables, symbol)) {
      return new VariableEntity(symbol, Number(this.variables[symbol]));
    } else {
      return TokenMapper.getInstance().getToken(symbol);
    }
  }

  public build(): ExpressionEntity {
    return new ExpressionEntity(this.tokens);
  }
}
