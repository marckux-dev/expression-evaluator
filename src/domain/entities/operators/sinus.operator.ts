import {OperatorAssociativity, OperatorEntity} from "../operator.entity";

export class SinusOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.sin,
      symbol: 'sin',
      precedence: 85,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}