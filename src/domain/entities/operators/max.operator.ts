import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateMax = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new ValueError('Max operator expects at least one operand');
  }
  return true;
};

export class MaxOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.max,
      validation: validateMax,
      symbol: 'max',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
