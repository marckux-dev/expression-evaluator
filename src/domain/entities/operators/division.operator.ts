// src/domain/entities/operators/division.operator.ts

import {OperatorEntity} from "../operator.entity";
import {ValueError} from "../errors";

const division = (n1: number, n2: number) => n2 / n1;
const divisionValidation = (n1: number, n2: number) => {
  if (n1 === 0) {
    throw new ValueError('Division by zero');
  }
  return true;
};

export class DivisionOperator extends OperatorEntity {
  constructor() {
    super({
      operation: division,
      validation: divisionValidation,
      symbol: '/',
      precedence: 20,
    });
  }
}