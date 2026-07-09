/**
 * Prepares a raw expression string for tokenization: surrounds every
 * symbol and every word with spaces and collapses runs of whitespace, so
 * the result can be split on single spaces. `'3+sin(PI)'` becomes
 * `'3 + sin ( PI )'`.
 *
 * Scientific-notation literals (`2e5`, `1.5E-3`, `4e+10`) are kept as a
 * single piece: the alternation matches them before the symbol/word rules
 * can split them. The exponent digits are mandatory, so a lone `2e` is
 * still split into `2 e`.
 *
 * Digit groups can use `_` as a separator, like JS numeric literals
 * (`1_523_245.45` → `1523245.45`, `1.000_001` → `1.000001`): the
 * underscores are stripped once the whole literal is captured. The rule
 * requires an underscore between digits, so it never touches identifiers
 * (`_tmp`) or a plain leading-dot decimal (`.5`), and combining it with
 * scientific notation (`1_000e2`) is not supported.
 *
 * Words follow the identifier shape of {@link VARIABLE_NAME_PATTERN}
 * (unanchored here): an optional leading `_`/`$`, letters, and an optional
 * `_`-separated numeric suffix. `x_12` is one word; `x2` splits into
 * `x 2` (a coefficient goes before, never after).
 */
export class FormatterUsecase {

  execute(expression: string): string {
    // one pass, first match wins: underscore-grouped number | scientific literal | word | symbol
    expression = expression.replace(
      /(\d+(?:_\d+)+(?:\.\d+(?:_\d+)*)?|\d+\.\d+(?:_\d+)+)|(\d+(?:\.\d+)?[eE][+-]?\d+)|([$_]?[a-zA-Z]+(?:_[0-9]+)?)|([^a-zA-Z0-9._\s])/g,
      (match, groupedNumber) => groupedNumber ? ` ${groupedNumber.replace(/_/g, '')} ` : ` ${match} `
    );
    // trim the expression
    expression = expression.trim();
    // remove any extra spaces
    expression = expression.replace(/\s+/g, ' ');
    return expression;
  }
}
