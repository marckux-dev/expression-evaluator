import {EvaluatorInterface} from "./evaluator.interface";
import {ExpressionBuilder} from "../builders";
import {CloseBracketController, CommaController, OpenBracketController} from "../../domain/entities/controllers";
import {InvalidExpressionError} from "../../domain/entities/errors";

/**
 * Evaluates expressions written in reverse Polish notation, e.g.
 * `3 4 2 1 - * +`. Tokens must be separated by spaces; no unary-operator
 * disambiguation is needed in RPN, and brackets/commas are rejected: RPN
 * encodes grouping through token order alone, so their presence signals a
 * malformed (likely infix) expression.
 *
 * The `evaluateRpn()` convenience function wraps this class.
 */
export class EvaluateRpnExpressionUsecase implements EvaluatorInterface {

  /**
   * @throws {InvalidExpressionError} if the expression is malformed, or
   *   contains a bracket or comma (meaningless in RPN).
   * @throws {ValueError} if an operand is out of an operator's domain.
   */
  execute(expression: string): number {
    const builder = new ExpressionBuilder(expression);
    const tokens = builder.tokenize().getTokens();
    const invalidToken = tokens.find(token =>
      token instanceof OpenBracketController
      || token instanceof CloseBracketController
      || token instanceof CommaController
    );
    if (invalidToken) {
      throw new InvalidExpressionError(`Unexpected ${invalidToken.getSymbol()} in RPN expression: brackets and commas are not valid in RPN.`);
    }
    const expressionEntity = builder.build();
    return expressionEntity.getValue();
  }
}
