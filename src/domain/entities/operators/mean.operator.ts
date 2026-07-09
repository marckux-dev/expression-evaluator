import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const mean = (...operands: number[]) =>
  operands.reduce((a, b) => a + b, 0) / operands.length;

const validateMean = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new ValueError('Mean operator expects at least one operand');
  }
  return true;
};

export class MeanOperator extends OperatorEntity {
  constructor() {
    super({
      operation: mean,
      validation: validateMean,
      symbol: 'mean',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
