import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class FloorOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.floor,
      symbol: 'floor',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
