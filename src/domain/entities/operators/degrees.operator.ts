import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

// Radians to degrees: deg(PI) = 180. The inverse of rad().
const degrees = (n: number) => (n * 180) / Math.PI;

export class DegreesOperator extends OperatorEntity {
  constructor() {
    super({
      operation: degrees,
      symbol: 'deg',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
