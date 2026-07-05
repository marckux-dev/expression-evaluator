
import {ConstantEntity} from "../constant.entity";


export class PiConstant extends ConstantEntity {
  constructor() {
    super(Math.PI);
  }

  getSymbol(): string {
    return 'PI';
  }
}