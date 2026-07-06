import {TokenInterface} from "./token.interface";

/**
 * A structural, non-value token: brackets, the argument-separator comma and
 * the EOF sentinel used by variadic operators. Controllers guide parsing
 * and evaluation but never produce a value themselves.
 */
export class ControllerEntity implements TokenInterface {
  private readonly symbol: string;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  getSymbol(): string {
    return this.symbol;
  }
}
