// src/domain/entities/operators/multiplication.operator.ts

import {OperatorEntity} from "../operator.entity";

const multiplication = (n1: number, n2: number) => n2 * n1;

export class MultiplicationOperator extends OperatorEntity {
  constructor() {
    super({
      operation: multiplication,
      symbol: '*',
      precedence: 20,
    });
  }
}