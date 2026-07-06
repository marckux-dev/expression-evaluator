import {
  OperatorAssociativity,
  OperatorEntity,
} from '../operator.entity';

const multiplication = (n1: number, n2: number) => n2 * n1;

/**
 * The `*` that `StandardExpressionBuilder` inserts between juxtaposed
 * operands (`2PI`, `(1+2)(3+4)`, `2 sin PI`…). It is intentionally NOT
 * exported from the operators barrel: it cannot be written in an
 * expression (its symbol would clash with the real `*` in the
 * `TokenMapper`), it only exists after tokenization.
 *
 * Unlike the explicit `*` (precedence 20), it shares precedence 85 with
 * the prefix functions (`sin`, `cos`, `sqrt`, `max`) and is RIGHT
 * associative. Both properties together make juxtaposition behave like
 * the function-application chain it sits in:
 *
 * - `2 sin PI` → the equal-precedence/RIGHT rule keeps the implicit `*`
 *   stacked under `sin`, so it multiplies by the *result*: `2 * sin(PI)`.
 * - `sin 2 PI` → same rule keeps `sin` stacked under the implicit `*`,
 *   so the function absorbs the whole product: `sin(2 * PI)`.
 *
 * It still binds looser than `^` and `!` (95): `2PI^2` is `2*(PI^2)`.
 */
export class ImplicitMultiplicationOperator extends OperatorEntity {
  constructor() {
    super({
      operation: multiplication,
      symbol: '*',
      precedence: 85,
      associativity: OperatorAssociativity.RIGHT,
    });
  }
}
