import { TokenMapper } from './token.mapper';
import { TokenInterface } from '../../domain/entities';
import { InvalidExpressionError } from '../../domain/entities/errors/invalid-expression.error';

class DummyToken implements TokenInterface {
  getSymbol(): string {
    return '__DUMMY_TOKEN__';
  }
}

class OtherDummyToken implements TokenInterface {
  getSymbol(): string {
    return '__DUMMY_TOKEN__';
  }
}

describe('token.mapper.ts', () => {
  describe('getInstance', () => {
    it('should always return the same instance', () => {
      const instance1 = TokenMapper.getInstance();
      const instance2 = TokenMapper.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('has', () => {
    it('should return true for a built-in operator symbol', () => {
      expect(TokenMapper.getInstance().has('+')).toBe(true);
    });

    it('should return true for a built-in constant symbol', () => {
      expect(TokenMapper.getInstance().has('PI')).toBe(true);
    });

    it('should return false for an unknown symbol', () => {
      expect(TokenMapper.getInstance().has('__NOT_REGISTERED__')).toBe(false);
    });

    it('should return true after registering a custom token', () => {
      TokenMapper.getInstance().registerToken(DummyToken);
      expect(TokenMapper.getInstance().has('__DUMMY_TOKEN__')).toBe(true);
    });
  });

  describe('getSymbols', () => {
    it('should include built-in operators and constants', () => {
      const symbols = TokenMapper.getInstance().getSymbols();
      expect(symbols).toEqual(expect.arrayContaining(['+', 'sin', 'sqrt', 'PI', 'mod']));
    });

    it('should include custom tokens once registered', () => {
      TokenMapper.getInstance().registerToken(DummyToken);
      expect(TokenMapper.getInstance().getSymbols()).toContain('__DUMMY_TOKEN__');
    });

    it('every symbol it returns should resolve through getToken', () => {
      const mapper = TokenMapper.getInstance();
      for (const symbol of mapper.getSymbols()) {
        expect(mapper.getToken(symbol).getSymbol()).toBe(symbol);
      }
    });
  });

  describe('getToken', () => {
    it('should return a token instance for a known symbol', () => {
      const token = TokenMapper.getInstance().getToken('+');
      expect(token.getSymbol()).toBe('+');
    });

    it('should return a new instance on every call', () => {
      const token1 = TokenMapper.getInstance().getToken('+');
      const token2 = TokenMapper.getInstance().getToken('+');
      expect(token1).not.toBe(token2);
    });

    it('should throw InvalidExpressionError for an unknown symbol', () => {
      expect(() =>
        TokenMapper.getInstance().getToken('__NOT_REGISTERED__')
      ).toThrow(InvalidExpressionError);
    });

    it('should include the symbol in the error message', () => {
      expect(() =>
        TokenMapper.getInstance().getToken('__NOT_REGISTERED__')
      ).toThrow(
        '__NOT_REGISTERED__ is not a valid operator, constant or a registered variable'
      );
    });
  });

  describe('registerToken', () => {
    it('should make a custom token retrievable via getToken', () => {
      TokenMapper.getInstance().registerToken(DummyToken);
      const token = TokenMapper.getInstance().getToken('__DUMMY_TOKEN__');
      expect(token).toBeInstanceOf(DummyToken);
    });

    it('should replace a previously registered class for the same symbol', () => {
      TokenMapper.getInstance().registerToken(DummyToken);
      TokenMapper.getInstance().registerToken(OtherDummyToken);
      const token = TokenMapper.getInstance().getToken('__DUMMY_TOKEN__');
      expect(token).toBeInstanceOf(OtherDummyToken);
      expect(token).not.toBeInstanceOf(DummyToken);
    });

    it('should reject the reserved exponent symbols e and E', () => {
      class LowercaseE implements TokenInterface {
        getSymbol(): string { return 'e'; }
      }
      class UppercaseE implements TokenInterface {
        getSymbol(): string { return 'E'; }
      }
      expect(() => TokenMapper.getInstance().registerToken(LowercaseE)).toThrow(/reserved/);
      expect(() => TokenMapper.getInstance().registerToken(UppercaseE)).toThrow(/reserved/);
      expect(TokenMapper.getInstance().has('e')).toBe(false);
      expect(TokenMapper.getInstance().has('E')).toBe(false);
    });
  });
});
