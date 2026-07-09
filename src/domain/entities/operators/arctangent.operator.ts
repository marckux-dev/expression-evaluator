import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class ArctangentOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.atan,
      symbol: 'atan',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
