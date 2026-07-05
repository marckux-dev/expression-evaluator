// src/domain/entities/expression.entity.ts

import {TokenInterface} from "./token.interface";
import {InvalidExpressionError} from "./errors";
import {ConstantEntity} from "./constant.entity";
import {OperatorEntity} from "./operator.entity";
import {ControllerEntity} from "./controller.entity";

export class ExpressionEntity {
  private readonly _tokens: TokenInterface[];

  constructor(tokens: TokenInterface[]) {
    this._tokens = tokens;
  }

  public getTokens() : TokenInterface[] {
    return this._tokens.slice();
  }

  public evaluate() : ExpressionEntity {
    const tokens = this.getTokens();
    if (tokens.length === 0) {
      throw new InvalidExpressionError(`The expression is empty`);
    }
    const stack: TokenInterface[] = [];
    while (tokens.length > 0) {
      const token = tokens.shift();
      if (token instanceof ConstantEntity || token instanceof ControllerEntity) {
        stack.push(token);
      } else if (token instanceof OperatorEntity) {
        token.execute(stack);
      }
    }
    return new ExpressionEntity(stack);
  }

  public getValue(): number {
    const expression = this.evaluate();
    if (expression.getTokens().length !== 1) {
      throw new InvalidExpressionError(`The evaluated expression gets more than one token`);
    }
    const token = expression.getTokens()[0];
    if (!(token instanceof ConstantEntity)) {
      throw new InvalidExpressionError(`The evaluated expression is not a constant`);
    }

    return (token as ConstantEntity).getValue();
  }

  public toString() : string {
    return this.getTokens().map(token => token.getSymbol()).join(" ");
  }


}