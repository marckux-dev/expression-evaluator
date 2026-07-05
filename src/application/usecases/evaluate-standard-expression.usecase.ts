import {EvaluatorInterface} from "./evaluator.interface";
import {StandardExpressionBuilder} from "../builders/standard.expression.builder";
import {ExpressionEntity} from "../../domain/entities";


export class EvaluateStandardExpressionUsecase implements EvaluatorInterface {

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