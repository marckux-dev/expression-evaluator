import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

const validateAcosh = (n: number) => {
  if (n < 1) {
    throw new ValueError('acosh argument out of [1, Infinity)');
  }
  return true;
};

export class HyperbolicArccosineOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.acosh,
      validation: validateAcosh,
      symbol: 'acosh',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
