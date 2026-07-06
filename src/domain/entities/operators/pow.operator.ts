import {OperatorAssociativity, OperatorEntity} from "../operator.entity";

// Operands arrive reversed: n1 is the exponent.
const pow = (n1: number, n2: number): number => Math.pow(n2, n1);

export class PowOperator extends OperatorEntity {
  constructor() {
    super({
      operation: pow,
      symbol: '^',
      precedence: 95,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}