import { ConstantEntity } from './constant.entity';

/**
 * A variable already resolved to its numeric value. Being a subclass of
 * {@link ConstantEntity} (like the named constants `PI`, `E`), it follows
 * the named-constant rules of implicit multiplication instead of the
 * numeric-literal ones: `2x` inserts a multiplication, `x2` is an error.
 * It keeps the variable name as its symbol so error messages can point
 * at `x` rather than at its substituted value.
 */
export class VariableEntity extends ConstantEntity {
  constructor(
    private readonly name: string,
    value: number
  ) {
    super(value);
  }

  getSymbol(): string {
    return this.name;
  }
}
