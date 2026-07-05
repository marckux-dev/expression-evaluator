import {ExpressionEntity} from "../../domain/entities";

export interface ParserInterface {
  execute: (expression: string) => ExpressionEntity;
}