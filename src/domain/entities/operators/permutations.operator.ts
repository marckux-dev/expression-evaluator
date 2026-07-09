import { OperatorEntity } from '../operator.entity';
import { ValueError } from '../errors';

// Permutations P(n, k) = n! / (n-k)!, written infix like on scientific
// calculators: 5 nPr 2 = 20. Operands arrive reversed: n1 is k, n2 is n.
const permutations = (n1: number, n2: number) => {
  const k = n1;
  const n = n2;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= n - i;
  }
  return result;
};

const validatePermutations = (n1: number, n2: number) => {
  if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
    throw new ValueError('nPr expects integer operands');
  }
  if (n1 < 0 || n2 < 0) {
    throw new ValueError('nPr expects non-negative operands');
  }
  if (n1 > n2) {
    throw new ValueError('nPr expects k <= n');
  }
  return true;
};

export class PermutationsOperator extends OperatorEntity {
  constructor() {
    super({
      operation: permutations,
      validation: validatePermutations,
      symbol: 'nPr',
      // Same precedence as nCr: tighter than * /, looser than ^.
      precedence: 30,
    });
  }
}
