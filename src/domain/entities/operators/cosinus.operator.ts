import {OperatorAssociativity, OperatorEntity} from "../operator.entity";

export class CosinusOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.cos,
      symbol: 'cos',
      precedence: 85,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}