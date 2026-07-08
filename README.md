# @marckux/expression-evaluator

[![npm version](https://img.shields.io/npm/v/%40marckux%2Fexpression-evaluator)](https://www.npmjs.com/package/@marckux/expression-evaluator)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![types included](https://img.shields.io/badge/types-included-blue)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

**Safely evaluate math expressions written by your users — and teach the evaluator your own
operators in a few lines.**

```ts
import { evaluate } from '@marckux/expression-evaluator';

evaluate('3 + 4 * (2 - 1)');             // 7
evaluate('2PI');                         // 6.283… — implicit multiplication
evaluate('sin(PI / 2) + max(1, 5)');     // 6
evaluate('(x + y) ^ 2', { x: 1, y: 2 }); // 9 — variables, bound per call
evaluate('5!');                          // 120
```

No `eval()`, no `new Function()`, no dependencies — just a small, strict-TypeScript
shunting-yard evaluator with typed errors you can show directly to end users.

## Why this library

Evaluating user-written formulas (form fields, configurable pricing rules, spreadsheet-like
inputs…) with `eval()` is a security hole, and pulling in a full computer-algebra system is
usually overkill. This package sits in the middle:

- **Zero runtime dependencies**, ~12 kB gzip. [mathjs](https://mathjs.org/) is a superb
  toolbox, but its parser comes with ~200 kB of universe you may not need.
- **Actively maintained and structurally safe.** The historical lightweight option,
  `expr-eval`, has been unmaintained since 2019 and carries unpatched CVEs. Here the token
  registry is a real `Map` (no prototype-pollution lookups) and nothing ever compiles
  strings into code.
- **Extensible by design** — not just custom functions: custom *operators* with position
  (prefix/infix/postfix), associativity, precedence, arity (including variadic) and domain
  validation. The demo calculator added `mod`, `tan`, `ln`, `log`, `abs`, a variadic `min`
  and a `PHI` constant in ~100 lines of consumer code, no fork.
- **Honest errors**: `InvalidExpressionError` for syntax, `ValueError` for out-of-domain
  operands (`sqrt(-1)`, `(-3)!`, `10/0`) — both `instanceof`-friendly and written to be
  shown to the person who typed the expression.
- **RPN as a first-class citizen**: `evaluateRpn('3 4 +')`, a rarity in this category.

## Install

```bash
npm install @marckux/expression-evaluator
```

TypeScript declarations ship with the package. CommonJS build, consumable from both `require`
and `import`.

## Usage

```ts
import { evaluate } from '@marckux/expression-evaluator';

evaluate('3 + 4 * (2 - 1)');          // 7
evaluate('sqrt(16) + 2 ^ 3');         // 12
evaluate('sin(PI / 2) + max(1, 5)');  // 6
evaluate('5!');                       // 120
evaluate('1.5e3 + 2E2');              // 1700 — scientific notation
evaluate('1_523_245.45');             // 1523245.45 — underscore digit grouping
evaluate('exp 1');                    // 2.718… — e^x; there is no E constant
```

### Built-in tokens

| Token | Meaning | Precedence | Notes |
| --- | --- | --- | --- |
| `+` `-` | add, subtract | 10 | also unary (`-3`, `+3`), then precedence 90 |
| `*` `/` | multiply, divide | 20 | `10/0` throws `ValueError` (see design notes) |
| `sin` `cos` `sqrt` `exp` | prefix functions | 85 | parentheses optional: `sin PI` |
| `max(…)` | variadic maximum | 85 | any number of comma-separated arguments |
| `^` | power | 95 | right-associative: `2^3^2` = `512` |
| `!` | factorial | 95 | postfix; non-negative integers only |
| `PI` | π | — | see design notes about `E` |

### Implicit multiplication

Multiplication can be left implicit wherever it is unambiguous — between a coefficient and a
constant, around parentheses, or against a function:

```ts
evaluate('2PI');           // 6.28…  = 2 * PI
evaluate('(1+2)(3+4)');    // 21     = (1+2) * (3+4)
evaluate('2 sin PI');      // 0      = 2 * sin(PI)
evaluate('sin 2 PI + 1');  // 1      — a function absorbs the whole product: sin(2*PI) + 1
```

A coefficient goes before, never after: `2 3` and `PI2` throw `InvalidExpressionError`
("Missing operator between…") instead of guessing.

### Number literals

Scientific notation and underscore digit grouping work exactly like JavaScript's own
literals:

```ts
evaluate('4e-10 + 1.5E3'); // 1500.0000000004
evaluate('1_000 + 1');     // 1001
evaluate('.5 + .5');       // 1
```

The underscore must sit strictly between two digits, and combining grouping with scientific
notation (`1_000e2`) is not supported.

### Variables

Pass a plain object as the second argument and use its keys in the expression. Values are
bound per call — nothing is registered globally, so different calls can use different values:

```ts
evaluate('x + 1', { x: 2 });               // 3
evaluate('(x + y) * 2', { x: 1, y: 2 });   // 6
evaluate('max(x, y, 1)', { x: -2, y: 5 }); // 5
```

Variable names are letter/underscore sequences (`x`, `radio`, `_tmp`). In implicit
multiplication they behave like named constants (`PI`): a coefficient goes before, never
after.

```ts
evaluate('2x', { x: 3 });          // 6      = 2 * x
evaluate('x y', { x: 3, y: 4 });   // 12     = x * y
evaluate('x(2+3)', { x: 2 });      // 10     = x * (2+3)
evaluate('x2', { x: 3 });          // throws: missing operator between x and 2
```

Two rules, both throwing `InvalidExpressionError`:

- Every variable used in the expression must be present in the object; otherwise it is just
  an unknown symbol.
- A variable name must not collide with a registered operator or constant (`PI`, `sin`…),
  and `e`/`E` are always rejected — they are part of the numeric exponent notation (`2e5`).
  The whole object is validated up front, even for names the expression never uses. To stay
  clear of any built-in — present or future — prefix your variables with `_` or another
  reserved character of your choice.

### Reverse Polish notation

```ts
import { evaluateRpn } from '@marckux/expression-evaluator';

evaluateRpn('3 4 2 1 - * +');      // 7
evaluateRpn('x 1 +', { x: 2 });    // 3 — variables work here too
```

Tokens are space-separated; brackets and commas are rejected (RPN encodes grouping through
order alone).

### Display formatting

`evaluate()`/`evaluateRpn()` always return full double precision — no rounding is ever
applied internally. `formatNumber()` is an opt-in presentation helper for when you're
about to show a result to a user:

```ts
import { evaluate, formatNumber } from '@marckux/expression-evaluator';

formatNumber(evaluate('sin(PI)'));       // '1.2246467991473532e-16' — no params, no rounding
formatNumber(evaluate('sin(PI)'), 12);   // '0' — maxDecimals collapses floating-point noise
formatNumber(evaluate('PI'), 12, 3);     // '3.14' — maxSignificantDigits caps digits shown
```

Both parameters are optional and independent: omit `maxDecimals` and/or
`maxSignificantDigits` to skip that particular rounding step entirely (the default).

### Error handling

```ts
import { evaluate, InvalidExpressionError, ValueError } from '@marckux/expression-evaluator';

try {
  evaluate(userInput);
} catch (error) {
  if (error instanceof InvalidExpressionError) {
    // malformed expression: unknown symbol, unbalanced brackets, missing operands…
  } else if (error instanceof ValueError) {
    // operand out of domain: factorial of a negative number, sqrt of a negative…
  }
}
```

## Extending with your own operators

Operators are small classes. Register them once (e.g. at app startup) and every subsequent
`evaluate()` call understands them:

```ts
import { evaluate, OperatorEntity, TokenMapper } from '@marckux/expression-evaluator';

// Operands arrive in reverse order (they are popped from a stack).
const modulo = (n1: number, n2: number): number => n2 % n1;

class ModuloOperator extends OperatorEntity {
  constructor() {
    super({ operation: modulo, symbol: 'mod', precedence: 20 }); // same precedence as * and /
  }
}

TokenMapper.getInstance().registerToken(ModuloOperator);

evaluate('10 mod 3'); // 1
```

`OperatorEntity` options:

| Option | Description |
| --- | --- |
| `symbol` | Token in the expression: a symbol (`%`) or a word (`mod`). |
| `operation` | The function. Its arity (`operation.length`) sets the number of operands. Operands arrive in reverse order. |
| `validation` | Optional. Checks operands: return `false` (or throw `ValueError` with your own message) for out-of-domain values. |
| `precedence` | Higher binds tighter; valid range 1–999. References: `+`/`-` 10, `*`/`/` 20, functions (`sin`, `sqrt`, `max`) 85, unary `+`/`-` 90, `^`/`!` 95. |
| `position` | `PREFIX`, `INFIX` (default) or `POSTFIX` (like `!`). Declare function-like operators as `PREFIX` so they take part in implicit multiplication (`2 sin PI`). |
| `associativity` | `LEFT` (default) or `RIGHT` (like `^`). |

For a variadic operator (arguments separated by commas, like `max(1, 5, 3)`), set
`this.numberOfOperands = 0` in the constructor after calling `super(...)`.

Constants work the same way:

```ts
import { ConstantEntity, TokenMapper } from '@marckux/expression-evaluator';

class Phi extends ConstantEntity {
  constructor() { super((1 + Math.sqrt(5)) / 2); }
  getSymbol(): string { return 'PHI'; }
}

TokenMapper.getInstance().registerToken(Phi);
```

UPPERCASE names for constants and lowercase for operators and variables is the recommended
convention. Registered tokens are process-global: register at startup, once.

## Design decisions

Deliberate choices you might otherwise report as bugs:

- **`10 / 0` throws `ValueError`** instead of returning IEEE-754 `Infinity` (what mathjs
  does). For user-written formulas an explicit error is almost always more useful than an
  `Infinity` propagating silently through the result.
- **There is no `E` constant.** The letters `e`/`E` are reserved for the exponent notation
  of numbers (`2e5` is 200000), and `registerToken` refuses them. Use `exp(1)` for Euler's
  number, or define your own constant under another name (`EULER`).
- **Unclosed opening brackets are forgiven**: `3-(2*(3+4` evaluates as `3-(2*(3+4))` = -11,
  the standard shunting-yard behaviour (and what most calculators do). An *extra closing*
  bracket is always an error.
- **Evaluation never rounds.** Results are raw doubles; presentation belongs to
  `formatNumber()`, which is strictly opt-in.

## Development

```bash
npm install
npm test               # jest — 165 tests
npm run test:coverage  # ~99% statement coverage
npm run build          # compiles to dist/ with type declarations
```

The source is ~1 300 lines of strict TypeScript in two layers (pure domain + application
pipeline) — small enough to read in one sitting.

## License

MIT
