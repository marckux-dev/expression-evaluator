import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// Uniform random number in [0, 1), like Math.random(). Written as a
// nullary call: rand(). The zero-arity operation makes the operator
// variadic in this design, so the validation pins the arity to exactly 0.
const random = () => Math.random();

const validateRandom = (...operands: number[]) => {
  if (operands.length > 0) {
    throw new ValueError('rand takes no arguments: use rand()');
  }
  return true;
};

export class RandomOperator extends OperatorEntity {
  constructor() {
    super({
      operation: random,
      validation: validateRandom,
      symbol: 'rand',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
