import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class TruncOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.trunc,
      symbol: 'trunc',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
