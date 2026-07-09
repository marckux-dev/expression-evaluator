import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateLog = (n: number) => {
  if (n <= 0) {
    throw new ValueError('Logarithm of a non-positive number');
  }
  return true;
};

// 'log' is base 10, the calculator convention; natural log is 'ln'.
export class LogBaseTenOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.log10,
      validation: validateLog,
      symbol: 'log',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
