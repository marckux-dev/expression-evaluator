import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// Present value of a future lump sum (discounting):
// pv(rate, nper, fv) = fv / (1 + rate)^nper.
// Rate is per period, as a fraction (5% = 0.05).
// Operands arrive reversed: (fv, nper, rate).
const presentValue = (fv: number, nper: number, rate: number) =>
  fv / (1 + rate) ** nper;

const validatePresentValue = (fv: number, nper: number, rate: number) => {
  if (rate <= -1) {
    throw new ValueError('pv expects a rate greater than -1 (-100%)');
  }
  return true;
};

export class PresentValueOperator extends OperatorEntity {
  constructor() {
    super({
      operation: presentValue,
      validation: validatePresentValue,
      symbol: 'pv',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
