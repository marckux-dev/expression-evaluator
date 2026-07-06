/**
 * Thrown when an expression is well-formed but an operand is outside an
 * operator's domain: division by zero, square root of a negative number,
 * factorial of a non-integer… Operator `validation` functions raise it,
 * either directly or by returning `false`.
 */
export class ValueError extends Error {
  constructor(message: string = 'Value error') {
    super(message);
    this.name = 'ValueError';
    Object.setPrototypeOf(this, ValueError.prototype);
  }
}
