import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const product = (...operands: number[]) => operands.reduce((a, b) => a * b, 1);

const validateProduct = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new ValueError('Prod operator expects at least one operand');
  }
  return true;
};

export class ProductOperator extends OperatorEntity {
  constructor() {
    super({
      operation: product,
      validation: validateProduct,
      symbol: 'prod',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
    // Variadic: collect operands until the EOF sentinel pushed by toRpn().
    this.numberOfOperands = 0;
  }
}
