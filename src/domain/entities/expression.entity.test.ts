
import {ExpressionEntity} from "./expression.entity";
import {InvalidExpressionError} from "./errors/invalid-expression.error";
import {OperatorEntity} from "./operator.entity";
import {ConstantEntity} from "./constant.entity";
import {VariableEntity} from "./variable.entity";
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

  describe('bind', () => {

    it('should bind unbound variables so the expression can be evaluated', () => {
      // x y + => 2 + 3 = 5
      const expression = new ExpressionEntity([new VariableEntity('x'), new VariableEntity('y'), add]);
      expect(expression.bind({x: 2, y: 3}).getValue()).toBe(5);
    });

    it('should return a new instance and leave the original unbound', () => {
      const expression = new ExpressionEntity([new VariableEntity('x')]);
      const bound = expression.bind({x: 2});
      expect(bound).not.toBe(expression);
      expect(bound.getValue()).toBe(2);
      // the original still has the unbound variable
      expect(() => expression.getValue()).toThrow(InvalidExpressionError);
    });

    it('should be reusable: the same expression bound N times with different values', () => {
      // r r * => r^2, the compile() use case
      const expression = new ExpressionEntity([new VariableEntity('r'), new VariableEntity('r'), mul]);
      expect(expression.bind({r: 2}).getValue()).toBe(4);
      expect(expression.bind({r: 3}).getValue()).toBe(9);
      expect(expression.bind({r: 10}).getValue()).toBe(100);
    });

    it('should leave constants and operators untouched', () => {
      // 5 x + => 5 + 4 = 9
      const expression = new ExpressionEntity([X, new VariableEntity('x'), add]);
      const bound = expression.bind({x: 4});
      expect(bound.getValue()).toBe(9);
      expect(bound.getTokens()[0]).toBe(X);
      expect(bound.getTokens()[2]).toBe(add);
    });

    it('should allow partial binding: a missing variable stays unbound and fails at getValue naming it', () => {
      const expression = new ExpressionEntity([new VariableEntity('x'), new VariableEntity('y'), add]);
      const partiallyBound = expression.bind({x: 2});
      expect(() => partiallyBound.getValue()).toThrow(InvalidExpressionError);
      expect(() => partiallyBound.getValue()).toThrow(/y/);
      // and completing the binding later works
      expect(partiallyBound.bind({y: 3}).getValue()).toBe(5);
    });

    it('should bind falsy values too: 0 is a value, not an absence', () => {
      // x y + => 0 + 3 = 3
      const expression = new ExpressionEntity([new VariableEntity('x'), new VariableEntity('y'), add]);
      expect(expression.bind({x: 0, y: 3}).getValue()).toBe(3);
    });

    it('should ignore extra values for variables the expression does not use', () => {
      const expression = new ExpressionEntity([new VariableEntity('x')]);
      expect(expression.bind({x: 1, unused: 99}).getValue()).toBe(1);
    });

    it('should keep an already bound variable when the mapping does not include it', () => {
      // x(bound to 3) y + => 3 + 4 = 7: only unbound variables need a value
      const expression = new ExpressionEntity([new VariableEntity('x', 3), new VariableEntity('y'), add]);
      expect(expression.bind({y: 4}).getValue()).toBe(7);
    });

    it('should keep the variable names in toString after binding', () => {
      const expression = new ExpressionEntity([new VariableEntity('x'), new VariableEntity('y'), add]);
      expect(expression.bind({x: 2, y: 3}).toString()).toBe('x y +');
    });

  });

});