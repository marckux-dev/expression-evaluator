/**
 * The minimal contract every token of an expression fulfils. Constants,
 * operators and structural controllers (brackets, commas) are all tokens;
 * the symbol is how the token is written in the source expression
 * (`3.14`, `+`, `sin`, `(`).
 */
export interface TokenInterface {

  getSymbol: () => string;
}
