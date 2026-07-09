import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

export class CubeRootOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.cbrt,
      symbol: 'cbrt',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
