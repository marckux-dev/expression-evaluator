import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateArccosine = (n: number) => {
  if (n < -1 || n > 1) {
    throw new ValueError('Arccosine argument out of [-1, 1]');
  }
  return true;
};

export class ArccosineOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.acos,
      validation: validateArccosine,
      symbol: 'acos',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
