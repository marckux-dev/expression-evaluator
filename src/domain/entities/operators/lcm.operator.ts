import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const gcd = (a: number, b: number) => {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

// Order does not matter for lcm, so the reversed operands are harmless.
const lcm = (n1: number, n2: number) => {
  if (n1 === 0 || n2 === 0) return 0;
  const a = Math.abs(n1);
  const b = Math.abs(n2);
  return (a / gcd(a, b)) * b;
};

const validateLcm = (n1: number, n2: number) => {
  if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
    throw new ValueError('lcm expects integer operands');
  }
  return true;
};

export class LcmOperator extends OperatorEntity {
  constructor() {
    super({
      operation: lcm,
      validation: validateLcm,
      symbol: 'lcm',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
