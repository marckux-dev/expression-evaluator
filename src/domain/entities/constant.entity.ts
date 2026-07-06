import {TokenInterface} from "./token.interface";

/**
 * A numeric value token. Literals in an expression (`3`, `2.5`) become
 * `ConstantEntity` instances, and every operator pushes its result back
 * onto the stack as one.
 *
 * To add a **named** constant, subclass it with a fixed value, override
 * `getSymbol()` with the name, and register it in the {@link TokenMapper}:
 *
 * ```ts
 * class PhiConstant extends ConstantEntity {
 *   constructor() { super((1 + Math.sqrt(5)) / 2); }
 *   getSymbol(): string { return 'PHI'; }
 * }
 * TokenMapper.getInstance().registerToken(PhiConstant);
 * ```
 */
export class ConstantEntity implements TokenInterface {
  private readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  getSymbol(): string {
    return `${this.value}`;
  }

  getValue(): number {
    return this.value;
  }

}
