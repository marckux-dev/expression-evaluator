// src/domain/entities/operators/subtraction.operator.ts

import {OperatorEntity} from "../operator.entity";

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
