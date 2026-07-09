import { ConstantEntity } from './constant.entity';
import { InvalidExpressionError } from './errors';

/**
 * Shape of a valid variable name, the single source of truth for every
 * place that validates or tokenizes identifiers: an optional leading `_`
 * or `$`, at least one letter, and an optional numeric suffix separated
 * by `_`.
 *
 * Valid: `x`, `_x`, `$x`, `x_12`, `$x_12`, `abc`, `_abc_123`.
 * Invalid: `_`, `$`, `x_`, `x1`, `x1_1`, `x_a`.
 */
export const VARIABLE_NAME_PATTERN = /^[_$]?[a-zA-Z]+(?:_[0-9]+)?$/;

/**
 * A named variable, either **bound** to a numeric value or **unbound**
 * (no value yet — the state produced by `compile()`, resolved later via
 * `ExpressionEntity.bind()`). Reading an unbound variable throws an
 * {@link InvalidExpressionError} naming it, so a missing value can never
 * leak into a result silently.
 *
 * Being a subclass of {@link ConstantEntity} (like the named constant
 * `PI`), a bound variable behaves as an operand everywhere and follows
 * the named-constant rules of implicit multiplication instead of the
 * numeric-literal ones: `2x` inserts a multiplication, `x2` is an error.
 * It keeps the variable name as its symbol so error messages can point
 * at `x` rather than at its substituted value.
 */
export class VariableEntity extends ConstantEntity {
  constructor(
    private readonly name: string,
    private readonly boundValue?: number
  ) {
    super(boundValue ?? NaN);
  }

  isBound(): boolean {
    return this.boundValue !== undefined;
  }

  bind(value: number): VariableEntity {
    return new VariableEntity(this.name, value);
  }

  getValue(): number {
    if (!this.isBound()) {
      throw new InvalidExpressionError(`The variable "${this.name}" has no value`);
    }
    return super.getValue();
  }

  getSymbol(): string {
    return this.name;
  }
}
