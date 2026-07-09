import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const sum = (...operands: number[]) => operands.reduce((a, b) => a + b, 0);

const validateSum = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new ValueError('Sum operator expects at least one operand');
  }
  return true;
};

export class SumOperator extends OperatorEntity {
  constructor() {
    super({
      operation: sum,
      validation: validateSum,
      symbol: 'sum',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
