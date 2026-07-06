import {ExpressionBuilder} from "./expression.builder";
import {
  AdditionOperator,
  NegationOperator,
  PositiveOperator,
  SubtractionOperator
} from "../../domain/entities/operators";
import {
  CloseBracketController,
  CommaController,
  EofController,
  OpenBracketController
} from "../../domain/entities/controllers";
import {
  ConstantEntity,
  ControllerEntity,
  OperatorAssociativity,
  OperatorEntity,
  OperatorPosition,
  TokenInterface
} from "../../domain/entities";
import {InvalidExpressionError} from "../../domain/entities/errors/invalid-expression.error";
import { MAX_OPERATOR_PRECEDENCE } from "../../domain/entities";

/**
 * Builder for standard (infix) notation. On top of tokenizing, it
 * disambiguates unary `+`/`-` and reorders the tokens into RPN, so the
 * expected call chain is:
 *
 * `tokenize().manageOperatorOverload().toRpn().build()`
 */
export class StandardExpressionBuilder extends ExpressionBuilder {

    /**
     * Replaces `+`/`-` with their unary counterparts (`pos`/`neg`) where
     * the context says they cannot be binary: at the start of the
     * expression, after `(`, after `,`, or after another operator —
     * except a POSTFIX one, since in `5! - 3` the `-` is binary.
     */
    public manageOperatorOverload(): this {

      for (let i=0; i<this.tokens.length; i++) {
        const token = this.tokens[i];
        // Solve the overload of '-' operator
        if (token instanceof SubtractionOperator) {
          if (i === 0
              || this.tokens[i-1] instanceof OpenBracketController
              || this.tokens[i-1] instanceof CommaController
              || (this.tokens[i-1] instanceof OperatorEntity
                  && !((this.tokens[i-1] as OperatorEntity).position === OperatorPosition.POSTFIX))) {
            this.tokens.splice(i,1, new NegationOperator());
          }
        }
        if (token instanceof AdditionOperator) {
          if (i === 0
              || this.tokens[i-1] instanceof OpenBracketController
              || this.tokens[i-1] instanceof CommaController
              || (this.tokens[i-1] instanceof OperatorEntity
                  && !((this.tokens[i-1] as OperatorEntity).position === OperatorPosition.POSTFIX))) {
            this.tokens.splice(i,1, new PositiveOperator());
          }
        }
      }
      return this;
    }

    /**
     * Shunting-yard conversion from infix to RPN.
     *
     * Brackets are handled through `level`: each `(` adds 100 to the
     * effective precedence of the operators inside it (and `)` removes
     * it), which is why bracket tokens themselves never reach the output.
     * An operator is pushed to the output after every stacked operator
     * with higher precedence — or equal precedence and LEFT associativity.
     * POSTFIX operators go straight to the output: their operands are
     * already there. Variadic operators (0 declared operands) first push
     * an EOF sentinel marking where their argument list starts.
     *
     * Unclosed opening brackets are not an error: `(` only adds to `level`
     * and never reaches the output, so any pending operators are flushed
     * from `operatorsStack` at the end regardless of how many brackets
     * were left open — the expression behaves as if every open bracket
     * had been closed at that point (e.g. `3-(2*(3+4` evaluates as
     * `3-(2*(3+4))` = -11). This is intended, not a bug. Only an *extra
     * closing* bracket is invalid, since it drives `level` negative.
     */
    public toRpn(): this {
      const tokens = this.getTokens();
      const stack: TokenInterface[] = [];
      const operatorsStack: OperatorEntity[] = [];
      let level = 0;
      let token = tokens.shift();
      while (token) {
        // Case: CONTROLLER
        if (token instanceof ControllerEntity) {
          if (token instanceof OpenBracketController) {
            level += (MAX_OPERATOR_PRECEDENCE + 1);
          } else if (token instanceof CloseBracketController) {
            level -= (MAX_OPERATOR_PRECEDENCE + 1);
          } else if (token instanceof CommaController) {
            // Nothing to do. Comma is not used in RPN
          }
          if (level < 0) {
            throw new InvalidExpressionError(`Error near ${token.getSymbol()}. Check the brackets.`);
          }

        // Case: CONSTANT
        } else if (token instanceof ConstantEntity) {
          stack.push(token);

        // Case: OPERATOR
        } else if (token instanceof OperatorEntity) {
          token.setPrecedence(token.getPrecedence() + level);
          // Check if the operator has an undefined number of operands
          if (token.getNumberOfOperands() === 0) {
            stack.push(new EofController());
          }
          let top = operatorsStack.pop();
          while (top && top.getPrecedence() >= token.getPrecedence()) {
            if (top.getPrecedence() === token.getPrecedence() && top.associativity === OperatorAssociativity.RIGHT) {
              break;
            }
            stack.push(top);
            top = operatorsStack.pop();
          }
          top && operatorsStack.push(top);
          if (token.position === OperatorPosition.POSTFIX) {
            stack.push(token);
          } else {
            operatorsStack.push(token);
          }
        }
        token = tokens.shift();
      }
      stack.push(...operatorsStack.reverse());
      this.tokens = stack;
      return this;
    }
}
