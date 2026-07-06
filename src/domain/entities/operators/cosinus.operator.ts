import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class CosinusOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.cos,
      symbol: 'cos',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
