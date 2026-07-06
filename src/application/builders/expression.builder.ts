import {ConstantEntity, ExpressionEntity, TokenInterface} from "../../domain/entities";
import {FormatterUsecase} from "../usecases/formatter.usecase";
import {TokenMapper} from "../mappers";

/**
 * Turns a raw expression string into an {@link ExpressionEntity}. This base
 * builder assumes the tokens are already in evaluation (RPN) order; for
 * infix input use {@link StandardExpressionBuilder}, which adds the
 * conversion steps.
 */
export class ExpressionBuilder {

  protected tokens: TokenInterface[] = [];

  constructor(
    private expression: string
  ) {}

  public getTokens(): TokenInterface[] {
    return this.tokens.slice();
  }

  /**
   * Splits the formatted expression and maps each piece to a token:
   * numeric literals become {@link ConstantEntity}, anything else is looked
   * up in the {@link TokenMapper} (which throws for unknown symbols).
   */
  public tokenize(): this {
    const formatter = new FormatterUsecase();
    const formattedExpression = formatter.execute(this.expression);
    const mapper = TokenMapper.getInstance();
    const stringTokens = formattedExpression.split(' ').filter(symbol => symbol !== '');
    this.tokens = stringTokens.map((symbol: string): TokenInterface => {
      if (!isNaN(Number(symbol))) {
        return new ConstantEntity(Number(symbol));
      } else {
        return mapper.getToken(symbol);
      }
    });
    return this;
  }

  public build(): ExpressionEntity {
    return new ExpressionEntity(this.tokens);
  }

}
