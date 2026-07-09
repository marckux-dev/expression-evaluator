import { OperatorEntity } from '../operator.entity';
import { ValueError } from '../errors';

// Binomial coefficient C(n, k), written infix like on scientific
// calculators: 5 nCr 2 = 10. Operands arrive reversed: n1 is k, n2 is n.
// Multiplicative form to avoid the overflow of computing factorials.
const combinations = (n1: number, n2: number) => {
  const k = n1;
  const n = n2;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return Math.round(result);
};

const validateCombinations = (n1: number, n2: number) => {
  if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
    throw new ValueError('nCr expects integer operands');
  }
  if (n1 < 0 || n2 < 0) {
    throw new ValueError('nCr expects non-negative operands');
  }
  if (n1 > n2) {
    throw new ValueError('nCr expects k <= n');
  }
  return true;
};

export class CombinationsOperator extends OperatorEntity {
  constructor() {
    super({
      operation: combinations,
      validation: validateCombinations,
      symbol: 'nCr',
      // Tighter than * / (20), looser than ^ (95), like on TI calculators:
      // 2 * 5 nCr 2 = 2 * (5 nCr 2) = 20.
      precedence: 30,
    });
  }
}
