import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// Order of arrival is irrelevant: the operands are sorted first.
const median = (...operands: number[]) => {
  const sorted = [...operands].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const validateMedian = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new ValueError('Median operator expects at least one operand');
  }
  return true;
};

export class MedianOperator extends OperatorEntity {
  constructor() {
    super({
      operation: median,
      validation: validateMedian,
      symbol: 'median',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
