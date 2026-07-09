import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class HyperbolicSineOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.sinh,
      symbol: 'sinh',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
