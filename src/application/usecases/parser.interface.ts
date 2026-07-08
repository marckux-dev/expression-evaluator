import {ExpressionEntity} from "../../domain/entities";

/**
 * Contract for anything that turns an expression string into an
 * {@link ExpressionEntity} without evaluating it. Internal for now.
 */
export interface ParserInterface {
  execute: (expression: string) => ExpressionEntity;
}