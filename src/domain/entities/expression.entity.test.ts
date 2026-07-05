
import {ExpressionEntity} from "./expression.entity";
import {InvalidExpressionError} from "./errors/invalid-expression.error";
import {OperatorEntity} from "./operator.entity";
import {ConstantEntity} from "./constant.entity";
import {EofController} from "./controllers";

const addition = (n1: number, n2: number) => n2 + n1;
const multiplication = (n1: number, n2: number) => n2 * n1;
const subtraction = (n1: number, n2: number) => n2 - n1;
const mean = (...operands: number[]) => operands.reduce((a, b) => a + b, 0) / operands.length;
const X = new ConstantEntity(5);
const Y = new ConstantEntity(3);
const Z = new ConstantEntity(2);
const EOF = new EofController()
const add = new OperatorEntity({operation: addition, symbol: '+'});
const sub = new OperatorEntity({operation: subtraction, symbol: '-'});
const mul = new OperatorEntity({operation: multiplication, symbol: '*'});
const avg = new OperatorEntity({operation: mean, symbol: 'avg'});

describe('expression.entity', () => {

  it('should evaluate an expression with a single constant', () => {
    const expression = new ExpressionEntity([X]);
    expect(expression.getValue()).toBe(5);
  });

  it('should throw an InvalidExpressionError if the tokens array is empty', () => {
    const expression = new ExpressionEntity([]);
    expect(() => expression.getValue()).toThrow(InvalidExpressionError)
  });

  it('should the method toString to show the symbols of the tokens', () => {
    const expression = new ExpressionEntity([X, Y, add]);
    expect(expression.toString()).toBe('5 3 +');
  });

  it('should evaluate different expressions', () => {
    // X Y + Z * => (5 + 3) * 2 = 16
    const expression_1 = new ExpressionEntity([X, Y, add, Z, mul]);
    expect(expression_1.getValue()).toBe(16);
    // X Y Z * + => 5 + (3 * 2) = 11
    const expression_2 = new ExpressionEntity([X, Y, Z, mul, add]);
    expect(expression_2.getValue()).toBe(11);
    // X Y Z - * => 5 * (3 - 2) = 5
    const expression_3 = new ExpressionEntity([X, Y, Z, sub, mul]);
    expect(expression_3.getValue()).toBe(5);
    // EOF X Y avg EOF X Z Z avg + => (5 + 3) / 2 + (5 + 2 + 2) / 3 = 7
    const expression_4 = new ExpressionEntity([EOF, X, Y, avg, EOF, X, Z, Z, avg, add]);
    expect(expression_4.getValue()).toBe(7);
  });

  it('should throw an InvalidExpressionError if the expression is invalid', () => {
    const expression = new ExpressionEntity([X, Y, Z, add]);
    expect(() => expression.getValue()).toThrow(InvalidExpressionError);
    const expression_2 = new ExpressionEntity([EOF]);
    expect(() => expression_2.getValue()).toThrow(InvalidExpressionError);
  });

});