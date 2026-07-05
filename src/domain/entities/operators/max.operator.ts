
import {OperatorAssociativity, OperatorEntity, OperatorPosition} from "../operator.entity";

const validateMax = (...operands: number[]) => {
  if (operands.length === 0) {
    throw new Error('Max operator expects at least one operand');
  }
  return true;
};

export class MaxOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.max,
      validation: validateMax,
      symbol: 'max',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT
    });
    this.numberOfOperands = 0;
  }
}