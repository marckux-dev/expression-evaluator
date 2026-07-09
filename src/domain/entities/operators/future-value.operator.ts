import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// Future value of a lump sum under compound interest:
// fv(rate, nper, pv) = pv * (1 + rate)^nper.
// Rate is per period, as a fraction (5% = 0.05).
// Operands arrive reversed: (pv, nper, rate).
const futureValue = (pv: number, nper: number, rate: number) =>
  pv * (1 + rate) ** nper;

const validateFutureValue = (pv: number, nper: number, rate: number) => {
  if (rate <= -1) {
    throw new ValueError('fv expects a rate greater than -1 (-100%)');
  }
  return true;
};

export class FutureValueOperator extends OperatorEntity {
  constructor() {
    super({
      operation: futureValue,
      validation: validateFutureValue,
      symbol: 'fv',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
