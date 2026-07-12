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

  describe('arity option', () => {
    it('defaults numberOfOperands to operation.length when arity is omitted', () => {
      const named = new OperatorEntity({ symbol: 'named', operation: (a, b) => a + b });
      const rest = new OperatorEntity({ symbol: 'rest', operation: (...o: number[]) => o.length });
      expect(named.getNumberOfOperands()).toBe(2);
      expect(rest.getNumberOfOperands()).toBe(0); // rest params report length 0
    });

    it('overrides operation.length: a rest-param operation gets a fixed arity', () => {
      const fixed = new OperatorEntity({
        symbol: 'fixed',
        operation: (...o: number[]) => o.length,
        arity: 3,
      });
      expect(fixed.getNumberOfOperands()).toBe(3);
    });

    it('a fixed-arity operator pops exactly `arity` operands (reversed) and leaves the rest', () => {
      // operation uses rest params, so without `arity` it would be variadic.
      const subtract = new OperatorEntity({
        symbol: 'sub',
        operation: (...o: number[]) => o[0] - o[1], // reversed: o[0] is the top of the stack
        arity: 2,
      });
      const stack = [new ConstantEntity(1), new ConstantEntity(10), new ConstantEntity(3)];
      subtract.execute(stack);
      // pops 3 then 10 → o = [3, 10] → 3 - 10 = -7; the 1 underneath is untouched
      expect(stack.length).toBe(2);
      expect((stack[0] as ConstantEntity).getValue()).toBe(1);
      expect((stack[1] as ConstantEntity).getValue()).toBe(-7);
    });

    it('arity: 0 forces a variadic operator even when the operation declares parameters', () => {
      const variadic = new OperatorEntity({
        symbol: 'vsum',
        operation: (a: number, b: number) => a + b, // length 2, but forced variadic
        arity: 0,
      });
      expect(variadic.getNumberOfOperands()).toBe(0);
    });

    it('an arity: 0 operator consumes operands until the EOF sentinel', () => {
      const sumAll = new OperatorEntity({
        symbol: 'sumAll',
        operation: (...o: number[]) => o.reduce((a, b) => a + b, 0),
        arity: 0,
      });
      const stack = [EOF, new ConstantEntity(1), new ConstantEntity(2), new ConstantEntity(4)];
      sumAll.execute(stack);
      expect((stack.pop() as ConstantEntity).getValue()).toBe(7);
    });
  });
});
