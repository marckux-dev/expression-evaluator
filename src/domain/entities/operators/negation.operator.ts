import {OperatorAssociativity, OperatorEntity} from "../operator.entity";

const negation = (n: number): number => -n;

export class NegationOperator extends OperatorEntity {
  constructor() {
    super({
      operation: negation,
      symbol: 'neg',
      precedence: 90,
      associativity: OperatorAssociativity.RIGHT
    });
  }
}
