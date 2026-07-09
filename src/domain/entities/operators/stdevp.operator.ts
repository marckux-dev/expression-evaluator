import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// POPULATION standard deviation (n denominator), like Excel's STDEV.P.
// For the sample version use 'stdev'.
const stdevp = (...operands: number[]) => {
  const n = operands.length;
  const mean = operands.reduce((a, b) => a + b, 0) / n;
  const sumOfSquares = operands.reduce((a, b) => a + (b - mean) ** 2, 0);
  return Math.sqrt(sumOfSquares / n);
};

const validateStdevp = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new ValueError('Population standard deviation expects at least one operand');
  }
  return true;
};

export class StdevpOperator extends OperatorEntity {
  constructor() {
    super({
      operation: stdevp,
      validation: validateStdevp,
      symbol: 'stdevp',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
