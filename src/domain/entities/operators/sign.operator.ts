import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class SignOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.sign,
      symbol: 'sign',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
