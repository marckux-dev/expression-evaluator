import {OperatorEntity} from "../operator.entity";
import {ValueError} from "../errors";

const validateSquareRoot = (n: number) => {
  if (n < 0) {
    throw new ValueError('Square root of a negative number');
  }
  return true;
};

export class SquareRootOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.sqrt,
      validation: validateSquareRoot,
      symbol: 'sqrt',
      precedence: 85
    });
  }

}