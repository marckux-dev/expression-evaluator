import {OperatorAssociativity, OperatorEntity} from "../operator.entity";

const positive = (n: number): number => n;

export class PositiveOperator extends OperatorEntity {
  constructor() {
    super({
      operation: positive,
      symbol: 'pos',
      precedence: 90,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}