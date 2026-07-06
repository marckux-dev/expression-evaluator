/**
 * Thrown when an expression is malformed: unknown symbol, unbalanced
 * brackets, missing operands, or an evaluation that does not collapse to a
 * single value. Catch it with `instanceof` to report syntax problems to
 * the end user.
 */
export class InvalidExpressionError extends Error {
  constructor(message: string = 'Invalid expression') {
    super(message);
    this.name = 'InvalidExpressionError';
    Object.setPrototypeOf(this, InvalidExpressionError.prototype);
  }
}
