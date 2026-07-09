import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// Order does not matter for gcd, so the reversed operands are harmless.
const gcd = (n1: number, n2: number) => {
  let a = Math.abs(n1);
  let b = Math.abs(n2);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

const validateGcd = (n1: number, n2: number) => {
  if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
    throw new ValueError('gcd expects integer operands');
  }
  return true;
};

export class GcdOperator extends OperatorEntity {
  constructor() {
    super({
      operation: gcd,
      validation: validateGcd,
      symbol: 'gcd',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
