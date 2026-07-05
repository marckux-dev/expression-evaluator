import {TokenInterface} from "./token.interface";
import {ConstantEntity} from "./constant.entity";
import {InvalidExpressionError} from "./errors";
import {EofController} from "./controllers";

export enum OperatorPosition {
  PREFIX = 'PREFIX',
  INFIX = 'INFIX',
  POSTFIX = 'POSTFIX',
}

export enum OperatorAssociativity {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface OperatorEntityOptions {
  symbol: string;
  operation: (...operands: number[]) => number;
  validation?: (...operands: number[]) => boolean;
  precedence?: number;
  position?: OperatorPosition;
  associativity?: OperatorAssociativity;
}

export  class OperatorEntity implements TokenInterface {
  public readonly symbol: string;
  protected numberOfOperands: number;
  public readonly operation: (...operands: number[]) => number;
  public readonly validation: (...operands: number[]) => boolean;
  public readonly position: OperatorPosition;
  public readonly associativity: OperatorAssociativity;
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
    this.validation(...operands);
    stack.push(new ConstantEntity(this.operation(...operands)));
  }

}