import {OperatorAssociativity, OperatorEntity, OperatorPosition} from "../operator.entity";

export class SinusOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.sin,
      symbol: 'sin',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}
