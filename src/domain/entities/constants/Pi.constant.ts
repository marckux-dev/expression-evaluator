import {ConstantEntity} from "../constant.entity";

/**
 * The built-in `PI` constant (`Math.PI`). Note there is deliberately no
 * `E` constant: `e`/`E` are reserved for the exponent notation of numeric
 * literals (`2e5`). Use `exp(1)` for Euler's number.
 */
export class PiConstant extends ConstantEntity {
  constructor() {
    super(Math.PI);
  }

  getSymbol(): string {
    return 'PI';
  }
}