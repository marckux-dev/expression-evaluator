import { TokenInterface } from '../../domain/entities';
import { InvalidExpressionError } from '../../domain/entities/errors/invalid-expression.error';
import { tokensRegister } from './tokens.register';

type TokenConstructor = new () => TokenInterface;
type TokenFactory = () => TokenInterface;

/**
 * Registry that maps a symbol (`+`, `sin`, `PI`…) to a **factory** that
 * builds a token for it. The tokenizer asks it for a fresh token instance
 * for every non-numeric piece of an expression — fresh because the RPN
 * conversion mutates a token's precedence per bracket level, so instances
 * cannot be shared between occurrences.
 *
 * There are two ways to register:
 *
 * - {@link registerToken} takes a no-arg token **class**; the mapper wraps
 *   it in a `() => new Class()` factory. This is how every built-in is
 *   registered on first access.
 * - {@link registerFactory} takes a symbol and an arbitrary factory
 *   function, so the produced token can close over state a class cannot
 *   carry (e.g. a user-defined function's compiled body).
 *
 * It is a **process-global singleton**: all built-in tokens are registered
 * on first access, and tokens you register are visible to every subsequent
 * `evaluate()` call anywhere in the process.
 *
 * ```ts
 * TokenMapper.getInstance().registerToken(ModuloOperator);
 * evaluate('10 mod 3'); // 1
 * ```
 */
export class TokenMapper {
  private static instance: TokenMapper;
  private tokenMap: Map<string, TokenFactory>;

  private constructor() {
    this.tokenMap = new Map();
    tokensRegister(this);
  }

  public static getInstance(): TokenMapper {
    if (!TokenMapper.instance) {
      TokenMapper.instance = new TokenMapper();
    }
    return TokenMapper.instance;
  }

  /**
   * Registers a token class under the symbol its instances report. The
   * class must be constructible with no arguments; registering an already
   * known symbol replaces the previous class.
   *
   * The symbols `e` and `E` are reserved: they are part of the numeric
   * exponent notation (`2e5`, `1.5E-3`) and cannot be registered.
   */
  public registerToken(tokenClass: TokenConstructor): void {
    const symbol = new tokenClass().getSymbol();
    if (symbol === 'e' || symbol === 'E') {
      throw new Error(
        `Symbol "${symbol}" is reserved: "e" and "E" are part of the numeric exponent notation (2e5).`
      );
    }
    const factory = () => new tokenClass();
    this.tokenMap.set(symbol, factory);
  }

  /**
   * Registers `factory` under `symbol`. Unlike {@link registerToken}, the
   * factory can be any function returning a {@link TokenInterface}, so the
   * token may close over runtime state — this is the extension point for
   * tokens that cannot be expressed as a no-arg class, such as a
   * user-defined function carrying its compiled body.
   *
   * The factory must return a token whose `getSymbol()` matches `symbol`
   * (the mapper trusts the caller and does not check). It is called anew
   * for every occurrence, so it must yield a fresh instance each time.
   * Registering an already known symbol replaces the previous entry.
   *
   * @throws {Error} if `symbol` is the reserved `e` or `E` (part of the
   *   numeric exponent notation `2e5`).
   */
  public registerFactory(symbol: string, factory: TokenFactory) {
    if (symbol === 'e' || symbol === 'E') {
      throw new Error(
        `Symbol "${symbol}" is reserved: "e" and "E" are part of the numeric exponent notation (2e5).`
      );
    }
    this.tokenMap.set(symbol, factory);
  }

  /**
   * Whether a token class is registered under `symbol`. Useful to detect
   * collisions before registering, or to check what a name will resolve to.
   */
  public has(symbol: string): boolean {
    return this.tokenMap.has(symbol);
  }

  /**
   * Removes the token registered under `symbol`, so the name becomes a free
   * variable again in later parses. Returns whether the symbol was
   * registered. Like registration, removal is **permissive**: built-ins are
   * not protected, so callers implementing "remove user-defined tokens only"
   * must keep track of which symbols are theirs.
   *
   * Beware: unregistering a built-in (`unregister('+')`, `unregister('sin')`)
   * is **irreversible for the process**. Built-in token classes are not part
   * of the public API, so they cannot be re-registered from outside; they
   * only come back on the next process start, when the registry is built
   * again. Nothing restores them short of that.
   *
   * Expressions compiled while the token existed keep working: they hold
   * their token instances already.
   */
  public unregister(symbol: string): boolean {
    return this.tokenMap.delete(symbol);
  }

  /**
   * Every registered symbol, in registration order. Lets consumers build
   * operator listings, keypads or autocompletion from the live registry
   * (built-ins plus anything they registered).
   */
  public getSymbols(): string[] {
    return [...this.tokenMap.keys()];
  }

  /**
   * Returns a new instance of the token registered under `symbol`.
   *
   * @throws {InvalidExpressionError} if the symbol is unknown.
   */
  public getToken(symbol: string): TokenInterface {
    const factory = this.tokenMap.get(symbol);
    if (!factory) {
      throw new InvalidExpressionError(
        `${symbol} is not a valid operator, constant or a registered variable`
      );
    } else {
      return factory();
    }
  }
}
