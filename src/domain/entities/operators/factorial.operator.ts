import {OperatorAssociativity, OperatorEntity, OperatorPosition} from "../operator.entity";
import {ValueError} from "../errors";

const factorial = (n: number) => {
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}

const factorialValidation = (n: number) => {
  if (n < 0) {
    throw new ValueError('Factorial of a negative number');
  }
  if (n % 1 !== 0) {
    throw new ValueError('Factorial of a floating point number');
  }
  return true;
};

export class FactorialOperator extends OperatorEntity {
  constructor() {
    super({
      operation: factorial,
      validation: factorialValidation,
      symbol: '!',
      precedence: 95,
      position: OperatorPosition.POSTFIX,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}