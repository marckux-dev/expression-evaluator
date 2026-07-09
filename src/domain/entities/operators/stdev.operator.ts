import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// SAMPLE standard deviation (n - 1 denominator), like Excel's STDEV.S.
// For the population version use 'stdevp'.
const stdev = (...operands: number[]) => {
  const n = operands.length;
  const mean = operands.reduce((a, b) => a + b, 0) / n;
  const sumOfSquares = operands.reduce((a, b) => a + (b - mean) ** 2, 0);
  return Math.sqrt(sumOfSquares / (n - 1));
};

const validateStdev = (...operands: number[]) => {
  if (operands.length < 2) {
    throw new ValueError('Sample standard deviation expects at least two operands');
  }
  return true;
};

export class StdevOperator extends OperatorEntity {
  constructor() {
    super({
      operation: stdev,
      validation: validateStdev,
      symbol: 'stdev',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
