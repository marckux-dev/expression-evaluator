import {
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
} from '../operator.entity';

// Degrees to radians: rad(180) = PI. Handy with the radian-based trig
// functions: sin(rad(90)) = 1.
const radians = (n: number) => (n * Math.PI) / 180;

export class RadiansOperator extends OperatorEntity {
  constructor() {
    super({
      operation: radians,
      symbol: 'rad',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
