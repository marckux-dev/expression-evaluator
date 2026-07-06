// src/domain/entities/operators/subtraction.operator.ts

import {OperatorEntity} from "../operator.entity";

// Operands are popped from the stack, so they arrive reversed: n1 is the subtrahend.
const subtraction = (n1: number, n2: number) => n2 - n1;

export class SubtractionOperator extends OperatorEntity {
  constructor() {
    super({
      operation: subtraction,
      symbol: '-',
      precedence: 10,
    });
  }
}
