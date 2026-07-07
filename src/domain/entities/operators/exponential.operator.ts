import {OperatorAssociativity, OperatorEntity, OperatorPosition} from "../operator.entity";

/**
 * Natural exponential: `exp x` is e^x, so `exp 1` is Euler's number.
 * There is deliberately no `E` constant: `e`/`E` are reserved for the
 * exponent notation of numeric literals (`2e5`, `1.5E-3`).
 */
export class ExponentialOperator extends OperatorEntity {
  constructor() {
    super({
      operation: Math.exp,
      symbol: 'exp',
      precedence: 85,
      position: OperatorPosition.PREFIX,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}
