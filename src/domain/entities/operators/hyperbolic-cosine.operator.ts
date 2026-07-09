import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class HyperbolicCosineOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.cosh,
      symbol: 'cosh',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
