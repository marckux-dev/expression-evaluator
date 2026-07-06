import {TokenInterface} from "../../domain/entities";
import {InvalidExpressionError} from "../../domain/entities/errors/invalid-expression.error";
import {tokensRegister} from "./tokens.register";

type TokenConstructor = new () => TokenInterface;

/**
 * Registry that maps a symbol (`+`, `sin`, `PI`…) to the token class that
 * handles it. The tokenizer asks it for a fresh token instance for every
 * non-numeric piece of an expression.
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
  private tokenMap: Map<string, TokenConstructor>;

  private constructor() {
    this.tokenMap = new Map();
    tokensRegister(this);
  }

  public static getInstance(): TokenMapper{
    if (!TokenMapper.instance) {
      TokenMapper.instance = new TokenMapper();
    }
    return TokenMapper.instance;
  }

  /**
   * Registers a token class under the symbol its instances report. The
   * class must be constructible with no arguments; registering an already
   * known symbol replaces the previous class.
   */
  public registerToken(tokenClass: TokenConstructor): void {
    const symbol = new tokenClass().getSymbol();
    this.tokenMap.set(symbol, tokenClass);
  }

  /**
   * Returns a new instance of the token registered under `symbol`.
   *
   * @throws {InvalidExpressionError} if the symbol is unknown.
   */
  public getToken(symbol: string): TokenInterface {
    const tokenClass = this.tokenMap.get(symbol);
    if (!tokenClass) {
      throw new InvalidExpressionError(`${symbol} is not a valid operator or constant`);
    } else {
      return new tokenClass();
    }
  }
}
