import {TokenInterface} from "./token.interface";
import {ConstantEntity} from "./constant.entity";
import {InvalidExpressionError, ValueError} from "./errors";
import {EofController} from "./controllers";

export const MAX_OPERATOR_PRECEDENCE = 999;

/**
 * Where the operator is written relative to its operands.
 *
 * - `PREFIX`: before them, like a function (`sin x`, `sqrt x`).
 * - `INFIX`: between them (`a + b`). The default.
 * - `POSTFIX`: after them (`5!`).
 */
export enum OperatorPosition {
  PREFIX = 'PREFIX',
  INFIX = 'INFIX',
  POSTFIX = 'POSTFIX',
}

/**
 * How operators of equal precedence group.
 *
 * `LEFT` (the default): `8 - 4 - 2` is `(8 - 4) - 2`.
 * `RIGHT`: `2 ^ 3 ^ 2` is `2 ^ (3 ^ 2)`.
 */
export enum OperatorAssociativity {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

/**
 * Configuration accepted by the {@link OperatorEntity} constructor.
 */
export interface OperatorEntityOptions {
  /**
   * The token that represents the operator in an expression: a symbol
   * (`%`) or a word (`mod`).
   */
  symbol: string;
  /**
   * The function that computes the result. Its arity (`operation.length`)
   * determines how many operands the operator consumes.
   *
   * Operands are popped from a stack, so they arrive **in reverse order**:
   * for `10 / 2` the operation receives `(2, 10)`.
   */
  operation: (...operands: number[]) => number;
  /**
   * Optional domain check, called with the same (reversed) operands before
   * `operation`. Either return `false` — which raises a generic
   * {@link ValueError} — or throw a {@link ValueError} with a custom
   * message. Defaults to accepting everything.
   */
  validation?: (...operands: number[]) => boolean;
  /**
   * Binding strength: higher binds tighter. References from the built-in
   * operators: `+`/`-` 10, `*`/`/` 20, prefix functions (`sin`, `sqrt`,
   * `max`) 85, unary `+`/`-` 90, `^` and `!` 95. Defaults to 1.
   */
  precedence?: number;
  /** See {@link OperatorPosition}. Defaults to `INFIX`. */
  position?: OperatorPosition;
  /** See {@link OperatorAssociativity}. Defaults to `LEFT`. */
  associativity?: OperatorAssociativity;
}

/**
 * An operator token: consumes operands from the evaluation stack and pushes
 * the result back as a {@link ConstantEntity}.
 *
 * Extend it to add your own operators, then register the subclass in the
 * {@link TokenMapper}:
 *
 * ```ts
 * class ModuloOperator extends OperatorEntity {
 *   constructor() {
 *     super({
 *       symbol: 'mod',
 *       operation: (n1, n2) => n2 % n1, // operands arrive reversed
 *       precedence: 20,                 // same as * and /
 *     });
 *   }
 * }
 * TokenMapper.getInstance().registerToken(ModuloOperator);
 * ```
 *
 * For a variadic operator (like `max(1, 5, 3)`) set
 * `this.numberOfOperands = 0` after calling `super(...)`: the operator will
 * then collect operands until it finds the EOF sentinel that marks where
 * its argument list started.
 */
export  class OperatorEntity implements TokenInterface {
  public readonly symbol: string;
  /** Arity. `0` means variadic: pop operands until the EOF sentinel. */
  protected numberOfOperands: number;
  public readonly operation: (...operands: number[]) => number;
  public readonly validation: (...operands: number[]) => boolean;
  public readonly position: OperatorPosition;
  public readonly associativity: OperatorAssociativity;
  /** Mutable: the RPN conversion adds the bracket-nesting level to it. */
  public precedence: number;

  constructor(options: OperatorEntityOptions) {
    const {
      symbol,
      operation,
      validation = (...operands) => true,
      precedence = 1,
      position = OperatorPosition.INFIX,
      associativity = OperatorAssociativity.LEFT,
    } = options;
    this.symbol = symbol;
    this.operation = operation;
    this.validation = validation;
    this.numberOfOperands = operation.length;
    this.precedence = precedence;
    this.position = position;
    this.associativity = associativity;
  }

  getNumberOfOperands(): number {
    return this.numberOfOperands;
  }

  getSymbol(): string {
    return this.symbol;
  }

  getPrecedence(): number {
    return this.precedence;
  }

  setPrecedence(precedence: number): void {
    this.precedence = precedence;
  }

  /**
   * Pops this operator's operands from `stack`, validates them, applies
   * `operation` and pushes the result back as a {@link ConstantEntity}.
   *
   * @throws {InvalidExpressionError} if the stack runs out of operands, or
   *   an EOF sentinel appears while a fixed number of operands is expected.
   * @throws {ValueError} if `validation` rejects the operands.
   */
  execute(stack: TokenInterface[]): void {
    const operands: number[] = [];
    const numberOfOperands = this.getNumberOfOperands();
    let n = numberOfOperands;
    while (numberOfOperands === 0 || n > 0) {
      const token = stack.pop();
      if (token === undefined) {
        throw new InvalidExpressionError(`Operator ${this.getSymbol()} has not enough operands.`);
      }
      if (token instanceof EofController) {
        if (numberOfOperands === 0) {
          break;
        } else {
          throw new InvalidExpressionError(`Unexpected EOF for operator ${this.getSymbol()}`);
        }
      }
      if (token instanceof ConstantEntity) {
        operands.push(token.getValue());
      }
      n--;
    }
    if (!this.validation(...operands)) {
      throw new ValueError(`Invalid operands for operator ${this.getSymbol()}`);
    }
    stack.push(new ConstantEntity(this.operation(...operands)));
  }

}
