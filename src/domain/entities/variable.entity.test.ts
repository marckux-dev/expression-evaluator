import { VariableEntity, VARIABLE_NAME_PATTERN } from './variable.entity';
import { ConstantEntity } from './constant.entity';
import { InvalidExpressionError } from './errors';

describe('VARIABLE_NAME_PATTERN', () => {
  const valid = ['x', '_x', '$x', 'x_12', '$x_12', 'abc', '_abc_123', 'radio'];
  const invalid = ['_', '$', 'x_', 'x1', 'x1_1', 'x_a', '2x', 'x_2_3', '$_', '__x', 'x-y', ''];

  it.each(valid)('should accept "%s"', (name) => {
    expect(VARIABLE_NAME_PATTERN.test(name)).toBe(true);
  });

  it.each(invalid)('should reject "%s"', (name) => {
    expect(VARIABLE_NAME_PATTERN.test(name)).toBe(false);
  });
});

describe('variable.entity.ts', () => {
  describe('bound variable (name and value)', () => {
    it('should return its value', () => {
      const x = new VariableEntity('x', 3);
      expect(x.getValue()).toBe(3);
    });

    it('should keep the variable name as its symbol, not the value', () => {
      const x = new VariableEntity('x', 3);
      expect(x.getSymbol()).toBe('x');
    });

    it('should report itself as bound', () => {
      const x = new VariableEntity('x', 3);
      expect(x.isBound()).toBe(true);
    });

    it('should be a ConstantEntity, so it behaves as an operand everywhere', () => {
      const x = new VariableEntity('x', 3);
      expect(x).toBeInstanceOf(ConstantEntity);
    });

    it('should treat an explicit NaN value as bound (the internal sentinel must not leak)', () => {
      const x = new VariableEntity('x', NaN);
      expect(x.isBound()).toBe(true);
      expect(x.getValue()).toBeNaN();
    });
  });

  describe('unbound variable (name only)', () => {
    it('should report itself as not bound', () => {
      const x = new VariableEntity('x');
      expect(x.isBound()).toBe(false);
    });

    it('should keep the variable name as its symbol', () => {
      const x = new VariableEntity('x');
      expect(x.getSymbol()).toBe('x');
    });

    it('should throw InvalidExpressionError on getValue, naming the variable', () => {
      const x = new VariableEntity('x');
      expect(() => x.getValue()).toThrow(InvalidExpressionError);
      expect(() => x.getValue()).toThrow(/x/);
    });
  });

  describe('bind', () => {
    it('should return a bound variable with the given value and the same name', () => {
      const x = new VariableEntity('x');
      const bound = x.bind(5);
      expect(bound.isBound()).toBe(true);
      expect(bound.getValue()).toBe(5);
      expect(bound.getSymbol()).toBe('x');
    });

    it('should not mutate the original: binding returns a new instance', () => {
      const x = new VariableEntity('x');
      const bound = x.bind(5);
      expect(bound).not.toBe(x);
      expect(x.isBound()).toBe(false);
    });

    it('should allow rebinding an already bound variable to a new value', () => {
      const x = new VariableEntity('x', 3);
      const rebound = x.bind(7);
      expect(rebound.getValue()).toBe(7);
      expect(x.getValue()).toBe(3);
    });
  });
});
