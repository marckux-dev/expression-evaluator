
import {ConstantEntity} from "../constant.entity";

export class EConstant extends ConstantEntity {
  constructor() {
    super(Math.E);
  }

  getSymbol(): string {
    return 'E';
  }
}