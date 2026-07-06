import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

const positive = (n: number): number => n;

export class PositiveOperator extends OperatorEntity {
  constructor() {
    super({
      operation: positive,
      symbol: 'pos',
      precedence: 90,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
