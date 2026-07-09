import { OperatorEntity } from '../operator.entity';
import { ValueError } from '../errors';

// Operands arrive reversed: n1 is the divisor. JS remainder semantics
// (the sign follows the dividend): -7 mod 3 = -1.
const modulo = (n1: number, n2: number) => n2 % n1;
const moduloValidation = (n1: number, n2: number) => {
  if (n1 === 0) {
    throw new ValueError('Modulo by zero');
  }
  return true;
};

export class ModuloOperator extends OperatorEntity {
  constructor() {
    super({
      operation: modulo,
      validation: moduloValidation,
      symbol: 'mod',
      precedence: 20, // same as * and /
    });
  }
}
