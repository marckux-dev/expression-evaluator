import { ExpressionBuilder } from './expression.builder';
import { ConstantEntity, ExpressionEntity, VariableEntity } from '../../domain/entities';
import { InvalidExpressionError } from '../../domain/entities/errors';

describe('expression.builder.ts', () => {
  describe('constructor variable collision validation', () => {
    it('should not throw when no variables are passed', () => {
      expect(() => new ExpressionBuilder('1 + 1')).not.toThrow();
    });

    it('should not throw when variables do not collide with any known token', () => {
      expect(() => new ExpressionBuilder('x + 1', { x: 2 })).not.toThrow();
    });

    it('should throw InvalidExpressionError when a variable name collides with an operator symbol', () => {
      expect(() => new ExpressionBuilder('1 + 1', { '+': 2 })).toThrow(InvalidExpressionError);
    });

    it('should throw InvalidExpressionError when a variable name collides with a built-in constant symbol', () => {
      expect(() => new ExpressionBuilder('1 + 1', { PI: 2 })).toThrow(InvalidExpressionError);
    });

    it('should detect a collision even when it is not the first variable in the record', () => {
      expect(() => new ExpressionBuilder('1 + 1', { x: 1, y: 2, PI: 3 })).toThrow(InvalidExpressionError);
    });
  });

  describe('tokenize', () => {
    it('should turn an integer literal into a ConstantEntity with that value', () => {
      const tokens = new ExpressionBuilder('42').tokenize().getTokens();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toBeInstanceOf(ConstantEntity);
      expect((tokens[0] as ConstantEntity).getValue()).toBe(42);
    });

    it('should turn a decimal literal into a ConstantEntity with that value', () => {
      const tokens = new ExpressionBuilder('3.5').tokenize().getTokens();
      expect((tokens[0] as ConstantEntity).getValue()).toBe(3.5);
    });

    it('should resolve an operator symbol via the TokenMapper', () => {
      const tokens = new ExpressionBuilder('1 + 1').tokenize().getTokens();
      expect(tokens[1].getSymbol()).toBe('+');
    });

    it('should resolve a built-in constant symbol via the TokenMapper', () => {
      const tokens = new ExpressionBuilder('PI').tokenize().getTokens();
      expect(tokens[0].getSymbol()).toBe('PI');
    });

    it('should substitute a variable symbol with a VariableEntity holding its value', () => {
      const tokens = new ExpressionBuilder('x', { x: 7 }).tokenize().getTokens();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toBeInstanceOf(VariableEntity);
      expect(tokens[0]).toBeInstanceOf(ConstantEntity);
      expect((tokens[0] as VariableEntity).getValue()).toBe(7);
    });

    it('should keep the variable name as the token symbol', () => {
      const tokens = new ExpressionBuilder('x', { x: 7 }).tokenize().getTokens();
      expect(tokens[0].getSymbol()).toBe('x');
    });

    it('should resolve a mix of numbers, operators and variables in one expression', () => {
      const tokens = new ExpressionBuilder('x + 1 * y', { x: 2, y: 5 }).tokenize().getTokens();
      const symbols = tokens.map(t => t.getSymbol());
      expect(symbols).toEqual(['x', '+', '1', '*', 'y']);
      expect((tokens[0] as VariableEntity).getValue()).toBe(2);
      expect((tokens[4] as VariableEntity).getValue()).toBe(5);
    });

    it('should throw InvalidExpressionError for a symbol that is not a number, known token or provided variable', () => {
      expect(() => new ExpressionBuilder('foo').tokenize()).toThrow(InvalidExpressionError);
    });

    it('should throw InvalidExpressionError when the expression references a variable missing from the record', () => {
      expect(() => new ExpressionBuilder('x + 1', { y: 2 }).tokenize()).toThrow(InvalidExpressionError);
    });

    it('should not resolve an unset variable using inherited Object.prototype properties', () => {
      expect(() => new ExpressionBuilder('toString').tokenize()).toThrow(InvalidExpressionError);
    });
  });

  describe('getTokens', () => {
    it('should return a copy of the internal tokens array', () => {
      const builder = new ExpressionBuilder('1 + 1').tokenize();
      const tokens = builder.getTokens();
      tokens.pop();
      expect(builder.getTokens()).toHaveLength(3);
    });
  });

  describe('build', () => {
    it('should return an ExpressionEntity built from the tokenized tokens', () => {
      const expressionEntity = new ExpressionBuilder('1 + 1').tokenize().build();
      expect(expressionEntity).toBeInstanceOf(ExpressionEntity);
    });
  });
});
