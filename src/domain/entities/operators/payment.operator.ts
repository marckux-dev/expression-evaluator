import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';
import { ValueError } from '../errors';

// Periodic payment of an amortizing loan (French system, like Excel's PMT
// for a zero future value): pmt(rate, nper, principal).
// Rate is per period, as a fraction (a 5% annual mortgage paid monthly is
// rate = 0.05/12). With rate = 0 it degrades to principal / nper.
// Operands arrive reversed: (principal, nper, rate).
const payment = (principal: number, nper: number, rate: number) =>
  rate === 0
    ? principal / nper
    : (principal * rate) / (1 - (1 + rate) ** -nper);

const validatePayment = (principal: number, nper: number, rate: number) => {
  if (!Number.isInteger(nper) || nper <= 0) {
    throw new ValueError('pmt expects a positive integer number of periods');
  }
  if (rate <= -1) {
    throw new ValueError('pmt expects a rate greater than -1 (-100%)');
  }
  return true;
};

export class PaymentOperator extends OperatorEntity {
  constructor() {
    super({
      operation: payment,
      validation: validatePayment,
      symbol: 'pmt',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
