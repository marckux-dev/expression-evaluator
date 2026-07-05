
export class InvalidExpressionError extends Error {
  constructor(message: string = 'Invalid expression') {
    super(message);
    this.name = 'InvalidExpressionError';
    Object.setPrototypeOf(this, InvalidExpressionError.prototype);
  }
}