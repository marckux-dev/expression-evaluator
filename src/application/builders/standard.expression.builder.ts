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


export class StandardExpressionBuilder extends ExpressionBuilder {

    public manageOperatorOverload(): this {

      for (let i=0; i<this.tokens.length; i++) {
        const token = this.tokens[i];
        // Solve the overload of '-' operator
        if (token instanceof SubtractionOperator) {
          if (i === 0
              || this.tokens[i-1] instanceof OpenBracketController
              || this.tokens[i-1] instanceof CommaController
              || this.tokens[i-1] instanceof OperatorEntity) {
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
            level += 100;
          } else if (token instanceof CloseBracketController) {
            level -= 100;
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