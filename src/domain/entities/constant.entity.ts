
import {TokenInterface} from "./token.interface";

export class ConstantEntity implements TokenInterface {
  private readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  getSymbol(): string {
    return `${this.value}`;
  }

  getValue(): number {
    return this.value;
  }

}
