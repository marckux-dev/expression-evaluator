import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class TangentOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.tan,
      symbol: 'tan',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
