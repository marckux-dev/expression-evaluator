import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class CeilOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.ceil,
      symbol: 'ceil',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
