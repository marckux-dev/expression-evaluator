
import {OperatorEntity} from "../operator.entity";

const addition = (n1: number, n2:number) => n2 + n1;

export class AdditionOperator extends OperatorEntity {
  constructor() {
    super({
      operation: addition,
      symbol: '+',
      precedence: 10,
    });
  }
}