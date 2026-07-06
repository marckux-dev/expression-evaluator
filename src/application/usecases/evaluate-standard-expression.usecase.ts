import {EvaluatorInterface} from "./evaluator.interface";
import {StandardExpressionBuilder} from "../builders/standard.expression.builder";
import {ExpressionEntity} from "../../domain/entities";

/**
 * Evaluates expressions written in standard (infix) notation, e.g.
 * `3 + 4 * (2 - 1)`. Pipeline: tokenize, disambiguate unary vs binary
 * `+`/`-`, convert to RPN (shunting-yard) and execute.
 *
 * The `evaluate()` convenience function wraps this class; instantiate it
 * directly when you want to hold on to an evaluator or inject it behind
 * {@link EvaluatorInterface}.
 */
export class EvaluateStandardExpressionUsecase implements EvaluatorInterface {

  /**
   * @throws {InvalidExpressionError} if the expression is malformed.
   * @throws {ValueError} if an operand is out of an operator's domain.
   */
  execute(expression: string): number {
    const builder = new StandardExpressionBuilder(expression);

    const expressionEntity: ExpressionEntity = builder
      .tokenize()
      .manageOperatorOverload()
      .toRpn()
      .build();

    return expressionEntity.getValue();

  }

}
