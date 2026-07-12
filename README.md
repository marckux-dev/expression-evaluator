# @marckux-dev/expression-evaluator

[![npm version](https://img.shields.io/npm/v/%40marckux-dev%2Fexpression-evaluator)](https://www.npmjs.com/package/@marckux-dev/expression-evaluator)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![types included](https://img.shields.io/badge/types-included-blue)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

**Safely evaluate math expressions written by your users — and teach the evaluator your own
operators in a few lines.**

```ts
import { evaluate, compile, defineFunction } from '@marckux-dev/expression-evaluator';

evaluate('3 + 4 * (2 - 1)');             // 7
evaluate('2PI');                         // 6.283… — implicit multiplication
evaluate('sin(PI / 2) + max(1, 5)');     // 6
evaluate('(x + y) ^ 2', { x: 1, y: 2 }); // 9 — variables, bound per call
evaluate('5!');                          // 120

const p = compile('x ^ 2 + y ^ 2');      // parse once…
p({ x: 3, y: 4 });                       // 25 — …evaluate many
p({ x: 5, y: 12 });                      // 169

defineFunction('hyp', ['x', 'y'], 'sqrt(x^2 + y^2)');
evaluate('hyp(3, 4)');                   // 5 — user-defined functions, they compose
```

No `eval()`, no `new Function()`, no dependencies — just a small, strict-TypeScript
shunting-yard evaluator with typed errors you can show directly to end users.

## Why this library

Evaluating user-written formulas (form fields, configurable pricing rules, spreadsheet-like
inputs…) with `eval()` is a security hole, and pulling in a full computer-algebra system is
usually overkill. This package sits in the middle:

- **Zero runtime dependencies**, ~14 kB gzip. [mathjs](https://mathjs.org/) is a superb
  toolbox, but its parser comes with ~200 kB of universe you may not need.
- **`compile()` — parse once, evaluate many.** The same formula evaluated against thousands
  of variable sets (a plotted curve, a pricing rule, a spreadsheet column) pays the parsing
  cost a single time.
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
npm install @marckux-dev/expression-evaluator
```

Dual ESM/CJS build: `import` gets a native ES module, `require` gets CommonJS, each with its
own TypeScript declarations. Node ≥ 18.

## Usage

```ts
import { evaluate } from '@marckux-dev/expression-evaluator';

evaluate('3 + 4 * (2 - 1)');          // 7
evaluate('sqrt(16) + 2 ^ 3');         // 12
evaluate('sin(PI / 2) + max(1, 5)');  // 6
evaluate('5!');                       // 120
evaluate('1.5e3 + 2E2');              // 1700 — scientific notation
evaluate('1_523_245.45');             // 1523245.45 — underscore digit grouping
evaluate('exp 1');                    // 2.718… — e^x; there is no E constant
```

### Built-in tokens

Operators, by precedence (higher binds tighter):

| Token | Meaning | Precedence | Notes |
| --- | --- | --- | --- |
| `+` `-` | add, subtract | 10 | also unary (`-3`, `+3`), then precedence 90 |
| `*` `/` `mod` | multiply, divide, remainder | 20 | `10/0` and `x mod 0` throw `ValueError` |
| `nCr` `nPr` | combinations, permutations | 30 | infix, as on scientific calculators: `5 nCr 2` = 10 |
| prefix functions | see below | 85 | parentheses optional for one argument: `sin PI` |
| `^` | power | 95 | right-associative: `2^3^2` = `512` |
| `!` | factorial | 95 | postfix; non-negative integers only |

Prefix functions (all precedence 85), by field:

| Field | Functions |
| --- | --- |
| Arithmetic | `abs`, `floor`, `ceil`, `round`, `trunc`, `sign`, `sqrt`, `cbrt`, `exp`, `ln`, `log` (base 10), `gcd(a, b)`, `lcm(a, b)` |
| Trigonometry | `sin`, `cos`, `tan`, `asin`, `acos`, `atan` (radians); `deg(x)`/`rad(x)` to convert — `sin(rad(90))` = 1 |
| Hyperbolic | `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh` |
| Statistics (variadic) | `max(…)`, `min(…)`, `sum(…)`, `prod(…)`, `mean(…)`, `median(…)`, `stdev(…)` (sample, n−1), `stdevp(…)` (population) |
| Probability | `rand()` — uniform in [0, 1) |
| Financial | `fv(rate, n, pv)`, `pv(rate, n, fv)`, `pmt(rate, n, principal)` — per-period fractional rate (5% = 0.05) |

Constants: `PI` (see the design notes about `E`). Out-of-domain arguments (`ln(0)`,
`asin(2)`, `2 nCr 5`, a non-integer number of periods…) throw `ValueError` with a specific
message.

```ts
evaluate('gcd(12, 18)');                 // 6
evaluate('52 nCr 5');                    // 2598960 — poker hands
evaluate('mean(2, 4, 6) + stdev(1, 5)'); // 6.828…
evaluate('floor(rand() * 6) + 1');       // a die roll
evaluate('pmt(0.05/12, 360, 200_000)');  // 1073.64… — monthly mortgage payment
```

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

A variable name is an optional leading `_` or `$`, one or more letters, and an optional
numeric suffix separated by `_`:

| Valid | Invalid |
| --- | --- |
| `x`, `radio`, `_tmp`, `$price`, `x_1`, `$x_12` | `x1` (digits need the `_`), `x_` (dangling `_`), `foo_bar` (`_` only introduces digits), `e`/`E` (reserved for `2e5`) |

In implicit multiplication variables behave like named constants (`PI`): a coefficient goes
before, never after.

```ts
evaluate('2x', { x: 3 });          // 6      = 2 * x
evaluate('x y', { x: 3, y: 4 });   // 12     = x * y
evaluate('x(2+3)', { x: 2 });      // 10     = x * (2+3)
evaluate('2 x_1', { x_1: 5 });     // 10     = 2 * x_1
evaluate('x2', { x: 3 });          // throws: missing operator between x and 2
```

Two rules, both throwing `InvalidExpressionError`:

- Every variable used in the expression must have a value: an identifier the evaluator does
  not recognize is treated as a variable, and if no value reaches it the evaluation fails
  naming it (`The variable "x" has no value`). Note this includes typos: `sen(x)` fails as
  an unvalued variable `sen`, not as a syntax error.
- A supplied name must be a valid variable name and must not collide with a registered
  operator or constant (`PI`, `sin`…); `e`/`E` are always rejected — they are part of the
  numeric exponent notation (`2e5`). The whole object is validated up front, even for names
  the expression never uses. To stay clear of any built-in — present or future — prefix your
  variables with `_` or `$`.

### Compile once, evaluate many

When the same formula runs repeatedly with different values, `compile()` pays the parsing
cost (tokenizing, implicit multiplication, RPN conversion) a single time and returns a
plain function you call with the values:

```ts
import { compile } from '@marckux-dev/expression-evaluator';

const area = compile('PI * r ^ 2');
area({ r: 1 });  // 3.141…
area({ r: 2 });  // 12.566…

const dist = compile('sqrt(x ^ 2 + y ^ 2)');
points.map(({ x, y }) => dist({ x, y }));
```

Compilation is eager and calls are stateless:

- A malformed expression throws `InvalidExpressionError` from `compile()` itself — you
  find out immediately, not on the first call.
- Free variables need no values at compile time; a value missing **at call time** throws
  naming the variable, and each call binds its own values (nothing leaks between calls).
- `compile(expr)(values)` is exactly equivalent to `evaluate(expr, values)` — same
  pipeline, different moment of binding.

A compiled expression also knows its **free variables** — in order of first appearance:

```ts
const f = compile('x + 2y + PI');
f.variables; // ['x', 'y'] — constants and operators are not variables
```

This is what you want for building dependency graphs (which cells does this spreadsheet
formula read?) or for validating user input before the first call.

The `CompiledExpression` type and the `CompileStandardExpressionUsecase` class are exported
for dependency injection and typing.

### User-defined functions

`defineFunction(name, params, body)` turns an expression into a named function that later
expressions can call — and combine, nest and pass to other functions — exactly like a
built-in:

```ts
import { defineFunction, evaluate } from '@marckux-dev/expression-evaluator';

defineFunction('double', ['x'], '2x');
defineFunction('hyp', ['x', 'y'], 'sqrt(x ^ 2 + y ^ 2)');

evaluate('hyp(3, 4)');           // 5
evaluate('double(hyp(3, 4))');   // 10 — functions compose
evaluate('2 hyp(3, 4)');         // 10 — and take part in implicit multiplication

defineFunction('norm', ['x', 'y', 'r'], 'hyp(x, y) / r');
evaluate('norm(3, 4, 10)');      // 0.5 — bodies can call earlier definitions
```

Under the hood the function is registered as a prefix operator (precedence 85, like `sin`
and `sqrt`), which is why composition needs no special machinery: to the parser it *is* an
ordinary function. The rules:

- **The body is parsed once**, at definition: a malformed body throws
  `InvalidExpressionError` immediately. Errors that depend on the arguments (a division by
  zero, a free variable that is not among `params`) surface when the function is called.
- **Parameters bind positionally**: `params` names the body's variables in argument order.
- **Definitions are process-global** (they live in the shared `TokenMapper`), and redefining
  a name replaces it. A body captures the definitions in scope *at definition time*:
  redefining `hyp` later does not change what `norm` computes.
- **Name functions with letters only** (`hyp`, `myFn`). The tokenizer splits a trailing
  digit off a word — `f2(3)` reads as `f * 2 * (3)` — so digits and underscores in function
  names will not do what you expect. Names are not checked against built-ins either:
  defining `sin` replaces `sin` (see the registry notes below).
- **A definition can be removed** with `TokenMapper.getInstance().unregister(name)`; the
  name becomes a free variable again in later parses. Expressions compiled while the
  function existed keep working.

`DefineFunctionUsecase` is exported for dependency injection and typing.

### Reverse Polish notation

```ts
import { evaluateRpn } from '@marckux-dev/expression-evaluator';

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
import { evaluate, formatNumber } from '@marckux-dev/expression-evaluator';

formatNumber(evaluate('sin(PI)'));       // '1.2246467991473532e-16' — no params, no rounding
formatNumber(evaluate('sin(PI)'), 12);   // '0' — maxDecimals collapses floating-point noise
formatNumber(evaluate('PI'), 12, 3);     // '3.14' — maxSignificantDigits caps digits shown
```

Both parameters are optional and independent: omit `maxDecimals` and/or
`maxSignificantDigits` to skip that particular rounding step entirely (the default).

### Error handling

```ts
import { evaluate, InvalidExpressionError, ValueError } from '@marckux-dev/expression-evaluator';

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
import { evaluate, OperatorEntity, TokenMapper } from '@marckux-dev/expression-evaluator';

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
| `operation` | The function. By default its arity (`operation.length`) sets the number of operands. Operands arrive in reverse order. |
| `arity` | Optional. Overrides `operation.length` as the number of operands — required when `operation` uses rest parameters (`(...args)` reports length 0). `arity: 0` means **variadic**: the operator collects every comma-separated argument, like `max(1, 5, 3)`. |
| `validation` | Optional. Checks operands: return `false` (or throw `ValueError` with your own message) for out-of-domain values. |
| `precedence` | Higher binds tighter; valid range 1–999. References: `+`/`-` 10, `*`/`/` 20, functions (`sin`, `sqrt`, `max`) 85, unary `+`/`-` 90, `^`/`!` 95. |
| `position` | `PREFIX`, `INFIX` (default) or `POSTFIX` (like `!`). Declare function-like operators as `PREFIX` so they take part in implicit multiplication (`2 sin PI`). |
| `associativity` | `LEFT` (default) or `RIGHT` (like `^`). |

Two examples using `arity`:

```ts
// Variadic: any number of comma-separated arguments.
class RangeOperator extends OperatorEntity {
  constructor() {
    super({
      symbol: 'range',
      operation: (...values: number[]) => Math.max(...values) - Math.min(...values),
      arity: 0, // variadic
      precedence: 85,
      position: OperatorPosition.PREFIX,
    });
  }
}

// Fixed arity with a rest-parameter implementation: state it explicitly.
class LogBaseOperator extends OperatorEntity {
  constructor() {
    super({
      symbol: 'logb', // logb(base, x); word symbols take letters only — 'atan2' would tokenize as 'atan' * 2
      operation: (...args: number[]) => Math.log(args[0]) / Math.log(args[1]), // reverse order: args[0] is x
      arity: 2,
      precedence: 85,
      position: OperatorPosition.PREFIX,
    });
  }
}
```

Constants work the same way:

```ts
import { ConstantEntity, TokenMapper } from '@marckux-dev/expression-evaluator';

class Phi extends ConstantEntity {
  constructor() { super((1 + Math.sqrt(5)) / 2); }
  getSymbol(): string { return 'PHI'; }
}

TokenMapper.getInstance().registerToken(Phi);
```

UPPERCASE names for constants and lowercase for operators and variables is the recommended
convention. Registered tokens are process-global: register at startup, once.

### Managing the registry

The `TokenMapper` singleton is the registry behind every parse, and it exposes more than
`registerToken`:

```ts
// A factory can close over runtime state a no-arg class cannot carry —
// here, an `ans` constant that always reads the previous result:
let ans = 0;
class AnsConstant extends ConstantEntity {
  getSymbol(): string { return 'ans'; }
}

const mapper = TokenMapper.getInstance();
mapper.registerFactory('ans', () => new AnsConstant(ans));

ans = evaluate('2 + 3');   // 5
evaluate('ans * 2');       // 10 — the factory captured the live variable

mapper.has('ans');         // true — check before registering, or resolve collisions
mapper.getSymbols();       // every registered symbol: build listings, keypads, completion
mapper.unregister('ans');  // remove it; returns whether it existed
```

- **`registerFactory(symbol, factory)`** registers a plain function returning a token, so
  the token can close over runtime state a no-arg class cannot carry — it is what
  `defineFunction` uses to attach a compiled body to an operator. The factory must return a
  **fresh instance on every call** (the parser mutates token state per occurrence) whose
  `getSymbol()` matches the registered symbol.
- **The registry is permissive by design**: registering an existing symbol replaces it, and
  `unregister` removes *anything* — including built-ins. Beware: unregistering a built-in
  (`unregister('+')`) is irreversible for the process, because built-in token classes are
  not part of the public API and only come back on the next process start. If your app
  distinguishes "my tokens" from built-ins, keep your own bookkeeping (or snapshot
  `getSymbols()` at startup) and gate on `has()` before touching a symbol.
- `e`/`E` are always rejected as symbols — they belong to the numeric exponent notation
  (`2e5`).

The `VARIABLE_NAME_PATTERN` regex is exported too: it is the single source of truth for
what the parser accepts as a variable/identifier name, so consumers can pre-validate names
exactly the same way.

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
- **Unknown identifiers are unbound variables, not syntax errors.** Anything shaped like a
  variable name is deferred until evaluation and fails then, naming itself (`The variable
  "sen" has no value`). This is what makes `compile()` work with free variables; the trade-off
  is that a typo surfaces at call time instead of parse time. Symbols that are *not* shaped
  like a name (`#`, `x_`) still fail at parse time.
- **Evaluation never rounds.** Results are raw doubles; presentation belongs to
  `formatNumber()`, which is strictly opt-in.

## Development

```bash
npm install
npm test               # jest — 329 tests
npm run test:coverage  # ~99% statement coverage
npm run build          # tsup — dual ESM/CJS bundles + type declarations in dist/
npm run typecheck      # tsc --noEmit over the build config
```

The source is ~1 500 lines of strict TypeScript in two layers (pure domain + application
pipeline) — small enough to read in one sitting.

## License

MIT
