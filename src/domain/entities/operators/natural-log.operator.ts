import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateLn = (n: number) => {
  if (n <= 0) {
    throw new ValueError('Logarithm of a non-positive number');
  }
  return true;
};

export class NaturalLogOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.log,
      validation: validateLn,
      symbol: 'ln',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
