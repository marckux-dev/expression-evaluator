import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateAtanh = (n: number) => {
  if (n <= -1 || n >= 1) {
    throw new ValueError('atanh argument out of (-1, 1)');
  }
  return true;
};

export class HyperbolicArctangentOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.atanh,
      validation: validateAtanh,
      symbol: 'atanh',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
