import {TokenInterface} from "./token.interface";
import {InvalidExpressionError} from "./errors";
import {ConstantEntity} from "./constant.entity";
import {OperatorEntity} from "./operator.entity";
import {ControllerEntity} from "./controller.entity";

/**
 * An immutable sequence of tokens in RPN order, ready to be executed.
 *
 * Evaluation walks the tokens against a stack: constants and controllers
 * are pushed, and each operator pops its operands and pushes its result.
 * A valid expression collapses to a single constant.
 */
export class ExpressionEntity {
  private readonly _tokens: TokenInterface[];

  constructor(tokens: TokenInterface[]) {
    this._tokens = tokens;
  }

  public getTokens() : TokenInterface[] {
    return this._tokens.slice();
  }

  /**
   * Executes the tokens and returns the resulting expression (usually a
   * single constant). Does not mutate this instance.
   */
  public evaluate() : ExpressionEntity {
    const tokens = this.getTokens();
    if (tokens.length === 0) {
      throw new InvalidExpressionError(`The expression is empty`);
    }
    const stack: TokenInterface[] = [];
    while (tokens.length > 0) {
      const token = tokens.shift();
      if (token instanceof ConstantEntity || token instanceof ControllerEntity) {
        stack.push(token);
      } else if (token instanceof OperatorEntity) {
        token.execute(stack);
      }
    }
    return new ExpressionEntity(stack);
  }

  /**
   * Evaluates the expression and returns its numeric value.
   *
   * @throws {InvalidExpressionError} if evaluation does not collapse to
   *   exactly one constant (e.g. missing operators or operands).
   */
  public getValue(): number {
    const expression = this.evaluate();
    if (expression.getTokens().length !== 1) {
      throw new InvalidExpressionError(`The evaluated expression gets more than one token`);
    }
    const token = expression.getTokens()[0];
    if (!(token instanceof ConstantEntity)) {
      throw new InvalidExpressionError(`The evaluated expression is not a constant`);
    }

    return (token as ConstantEntity).getValue();
  }

  public toString() : string {
    return this.getTokens().map(token => token.getSymbol()).join(" ");
  }


}
