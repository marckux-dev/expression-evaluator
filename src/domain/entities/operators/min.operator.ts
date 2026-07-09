import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateMin = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new ValueError('Min operator expects at least one operand');
  }
  return true;
};

export class MinOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.min,
      validation: validateMin,
      symbol: 'min',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
