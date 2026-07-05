import {TokenInterface} from "../../domain/entities";
import {InvalidExpressionError} from "../../domain/entities/errors/invalid-expression.error";
import {tokensRegister} from "./tokens.register";

type TokenConstructor = new () => TokenInterface;

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

  public registerToken(tokenClass: TokenConstructor): void {
    const symbol = new tokenClass().getSymbol();
    this.tokenMap.set(symbol, tokenClass);
  }

  public getToken(symbol: string): TokenInterface {
    const tokenClass = this.tokenMap.get(symbol);
    if (!tokenClass) {
      throw new InvalidExpressionError(`${symbol} is not a valid operator or constant`);
    } else {
      return new tokenClass();
    }
  }
}