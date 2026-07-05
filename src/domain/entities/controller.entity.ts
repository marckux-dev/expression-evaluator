import {TokenInterface} from "./token.interface";

export class ControllerEntity implements TokenInterface {
  private readonly symbol: string;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  getSymbol(): string {
    return this.symbol;
  }
}