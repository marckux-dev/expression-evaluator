import {EvaluatorInterface} from "./evaluator.interface";
import {ExpressionBuilder} from "../builders";

export class EvaluateRpnExpressionUseCase implements EvaluatorInterface {

  execute(expression: string): number {
    const builder = new ExpressionBuilder(expression);
    const expressionEntity = builder
      .tokenize()
      .build();
    return expressionEntity.getValue();
  }
}