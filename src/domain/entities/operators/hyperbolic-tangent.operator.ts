import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class HyperbolicTangentOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.tanh,
      symbol: 'tanh',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
