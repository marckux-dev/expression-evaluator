import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateArcsine = (n: number) => {
  if (n < -1 || n > 1) {
    throw new ValueError('Arcsine argument out of [-1, 1]');
  }
  return true;
};

export class ArcsineOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.asin,
      validation: validateArcsine,
      symbol: 'asin',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
