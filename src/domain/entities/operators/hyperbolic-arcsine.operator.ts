import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class HyperbolicArcsineOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.asinh,
      symbol: 'asinh',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
