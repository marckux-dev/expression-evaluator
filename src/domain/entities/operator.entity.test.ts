import { OperatorEntity } from './operator.entity';
import { ConstantEntity } from './constant.entity';
import { InvalidExpressionError } from './errors';
import { EofController } from "./controllers";

const addition = (n1: number, n2: number) => n2 + n1;
const mean = (...operands: number[]) => operands.reduce((a, b) => a + b, 0) / operands.length;
const add = new OperatorEntity(
  {
    operation: addition,
    symbol: '+',
  }
);
const avg = new OperatorEntity({
  operation: mean,
  symbol: 'mean',
});
const X = new ConstantEntity(3);
const Y = new ConstantEntity(4);
const EOF = new EofController();

describe('operator.entity', () => {

  it('should create an operator and get the attributes', () => {
    expect(add.getNumberOfOperands()).toBe(2);
    expect(add.getSymbol()).toBe('+');
    expect(add.getPrecedence()).toBe(1);
  });

  it('should change the precedence of the operator', () => {
    add.setPrecedence(2);
    expect(add.getPrecedence()).toBe(2);
  });


  it('should apply a simple addition operation', () => {
    const stack = [X, Y];
    add.execute(stack);
    expect(stack.length).toBe(1);
    expect(stack[0].getValue()).toBe(7);
  });

  it('should throw InvalidExpressionError if there are not enough operands', () => {
    expect(() => add.execute([X])).toThrow(InvalidExpressionError);
  });

  it('should apply to a undefined number of operands', () => {
    const stack = [X, EOF, X, Y, X, Y];
    avg.execute(stack);
    const top = stack.pop() as ConstantEntity;
    expect(top.getValue()).toBe(3.5);
  });

  it('should throw InvalidExpressionError if there is an unexpected EOF', () => {
    const stack = [X, EOF, Y];
    expect(() => add.execute(stack)).toThrow(InvalidExpressionError);
  });
});
