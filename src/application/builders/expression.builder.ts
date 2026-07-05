import {ConstantEntity, ExpressionEntity, TokenInterface} from "../../domain/entities";
import {FormatterUsecase} from "../usecases/formatter.usecase";
import {TokenMapper} from "../mappers";

export class ExpressionBuilder {

  protected tokens: TokenInterface[] = [];

  constructor(
    private expression: string
  ) {}

  public getTokens(): TokenInterface[] {
    return this.tokens.slice();
  }

  public tokenize(): this {
    const formatter = new FormatterUsecase();
    const formattedExpression = formatter.execute(this.expression);
    const mapper = TokenMapper.getInstance();
    const stringTokens = formattedExpression.split(' ');
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