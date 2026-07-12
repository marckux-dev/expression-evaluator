import { TokenMapper } from './token.mapper';
import { TokenInterface, OperatorEntity, OperatorPosition } from '../../domain/entities';
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

class DummyFactoryToken implements TokenInterface {
  getSymbol(): string {
    return '__FACTORY_TOKEN__';
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

  describe('registerFactory', () => {
    it('should register a factory-built token under its symbol', () => {
      TokenMapper.getInstance().registerFactory(
        '__FACTORY_TOKEN__',
        () => new DummyFactoryToken()
      );
      expect(TokenMapper.getInstance().has('__FACTORY_TOKEN__')).toBe(true);
      expect(TokenMapper.getInstance().getSymbols()).toContain('__FACTORY_TOKEN__');
    });

    it('should make the token retrievable via getToken', () => {
      TokenMapper.getInstance().registerFactory(
        '__FACTORY_TOKEN__',
        () => new DummyFactoryToken()
      );
      const token = TokenMapper.getInstance().getToken('__FACTORY_TOKEN__');
      expect(token).toBeInstanceOf(DummyFactoryToken);
      expect(token.getSymbol()).toBe('__FACTORY_TOKEN__');
    });

    it('should call the factory anew on every getToken (fresh instances)', () => {
      TokenMapper.getInstance().registerFactory(
        '__FACTORY_TOKEN__',
        () => new DummyFactoryToken()
      );
      const token1 = TokenMapper.getInstance().getToken('__FACTORY_TOKEN__');
      const token2 = TokenMapper.getInstance().getToken('__FACTORY_TOKEN__');
      expect(token1).not.toBe(token2);
    });

    it('should replace a previously registered symbol', () => {
      const mapper = TokenMapper.getInstance();
      mapper.registerFactory('__FACTORY_TOKEN__', () => new DummyFactoryToken());
      mapper.registerFactory('__FACTORY_TOKEN__', () => new OtherDummyToken());
      expect(mapper.getToken('__FACTORY_TOKEN__')).toBeInstanceOf(OtherDummyToken);
    });

    it('should reject the reserved exponent symbols e and E', () => {
      const mapper = TokenMapper.getInstance();
      expect(() => mapper.registerFactory('e', () => new DummyFactoryToken())).toThrow(/reserved/);
      expect(() => mapper.registerFactory('E', () => new DummyFactoryToken())).toThrow(/reserved/);
      expect(mapper.has('e')).toBe(false);
      expect(mapper.has('E')).toBe(false);
    });

    it('should unregister a token so the symbol becomes free again', () => {
      const mapper = TokenMapper.getInstance();
      mapper.registerFactory('__TEMP__', () => new DummyFactoryToken());
      expect(mapper.has('__TEMP__')).toBe(true);
      expect(mapper.unregister('__TEMP__')).toBe(true);
      expect(mapper.has('__TEMP__')).toBe(false);
      expect(mapper.getSymbols()).not.toContain('__TEMP__');
      expect(() => mapper.getToken('__TEMP__')).toThrow(InvalidExpressionError);
    });

    it('unregister returns false for a symbol that was never registered', () => {
      expect(TokenMapper.getInstance().unregister('__NEVER_THERE__')).toBe(false);
    });

    it('should register an operation whose factory closes over runtime state', () => {
      // A factory can carry state a no-arg class cannot: here the added
      // constant is captured in the closure, not hardcoded in a class.
      const addend = 7;
      const symbol = '__ADD7__';
      TokenMapper.getInstance().registerFactory(symbol, () =>
        new OperatorEntity({
          symbol,
          operation: (n: number) => n + addend,
          precedence: 85,
          position: OperatorPosition.PREFIX,
        })
      );
      const token = TokenMapper.getInstance().getToken(symbol);
      expect(token).toBeInstanceOf(OperatorEntity);
      expect((token as OperatorEntity).operation(3)).toBe(10);
    });
  });
});
