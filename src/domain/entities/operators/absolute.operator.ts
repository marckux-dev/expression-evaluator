import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class AbsoluteOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.abs,
      symbol: 'abs',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
