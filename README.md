# @marckux/expression-evaluator

Minimal, dependency-free and extensible math expression evaluator for TypeScript and JavaScript.
It safely evaluates expressions written by *users* (form fields, configurable formulas, rule
engines…) without ever touching `eval()`, and lets you register your own domain operators in a
few lines.

- **Zero runtime dependencies**, tiny footprint.
- Standard (infix) notation with the usual precedence, associativity and parentheses — plus RPN.
- Built-in: `+ - * / ^ !`, `sin`, `cos`, `sqrt`, `exp`, variadic `max(...)`, constant `PI`.
- Scientific notation: `4e-10`, `1.5E3`, `2e+5` — same literals JavaScript accepts.
- Underscore digit grouping: `1_523_245.45` — same separator JavaScript accepts.
- **Implicit multiplication**: `2PI`, `2(3+4)`, `(1+2)(3+4)`, `2 sin PI`…
- **Variables**: `evaluate('x + y', { x: 1, y: 2 })` — values passed per call, nothing global.
- **Extensible**: add operators and constants by subclassing and registering — no forking.
- Typed errors (`InvalidExpressionError`, `ValueError`) suitable for showing to end users.
- Written in TypeScript, ships with type declarations. Fully unit-tested.

## Install

```bash
npm install @marckux/expression-evaluator
```

## Usage

```ts
import { evaluate } from '@marckux/expression-evaluator';

evaluate('3 + 4 * (2 - 1)');          // 7
evaluate('sqrt(16) + 2 ^ 3');         // 12
evaluate('sin(PI / 2) + max(1, 5)');  // 6
evaluate('5!');                       // 120
evaluate('1.5e3 + 2E2');              // 1700 — scientific notation
evaluate('exp 1');                    // 2.718… — e^x; there is no E constant
```

There is deliberately **no `E` constant**: the letters `e`/`E` are reserved for the exponent
notation of numbers (`2e5` is 200000, `2E+3` is 2000). Use `exp(1)` for Euler's number, or
define your own constant under another name (`EULER`).

Large numbers can use `_` as a digit separator, on either side of the decimal point, again
matching JavaScript's own number literals:

```ts
evaluate('1_523_245.45');  // 1523245.45
evaluate('1_000 + 1');     // 1001
```

The underscore must sit strictly between two digits — `2 3` (space-separated) is still an
error ("a coefficient goes before, never after", see implicit multiplication below), and
combining grouping with scientific notation (`1_000e2`) is not supported.

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

### Variables

Pass a plain object as the second argument and use its keys in the expression. Values are
bound per call — nothing is registered globally, so different calls can use different values:

```ts
evaluate('x + 1', { x: 2 });               // 3
evaluate('(x + y) * 2', { x: 1, y: 2 });   // 6
evaluate('sin(x)', { x: 0 });              // 0
evaluate('max(x, y, 1)', { x: -2, y: 5 }); // 5
```

Variable names are letter/underscore sequences (`x`, `radio`, `_tmp`) — that is what the
tokenizer recognizes as a word. In implicit multiplication they behave like named constants
(`PI`): a coefficient goes before, never after.

```ts
evaluate('2x', { x: 3 });          // 6      = 2 * x
evaluate('x y', { x: 3, y: 4 });   // 12     = x * y
evaluate('x PI', { x: 3 });        // 9.42…  = x * PI (also 'PI x')
evaluate('x(2+3)', { x: 2 });      // 10     = x * (2+3)
evaluate('x2', { x: 3 });          // throws: missing operator between x and 2
evaluate('xPI', { x: 3 });         // throws: without a space it is one unknown symbol
```

Two rules, both throwing `InvalidExpressionError`:

- Every variable used in the expression must be present in the object; otherwise it is just
  an unknown symbol.
- A variable name must not collide with a registered operator or constant (`PI`, `sin`…),
  and `e`/`E` are always rejected — they are part of the numeric exponent notation (`2e5`).
  The whole object is validated up front, even for names the expression never uses. To stay
  clear of any built-in — present or future — prefix your variables with `_` or another
  reserved character of your choice.

```ts
evaluate('x + 1');           // throws: x is not a valid operator, constant or a registered variable
evaluate('1 + 1', { PI: 5 }); // throws: Variable "PI" collides with an existing operator or constant.
```

Reverse Polish notation:

```ts
import { evaluateRpn } from '@marckux/expression-evaluator';

evaluateRpn('3 4 2 1 - * +');      // 7
evaluateRpn('x 1 +', { x: 2 });    // 3 — variables work here too
```

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
| `precedence` | Higher binds tighter. References: `+`/`-` 10, `*`/`/` 20, functions (`sin`, `sqrt`, `max`) 85, unary `+`/`-` 90, `^`/`!` 95. |
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

The symbols `e` and `E` cannot be registered (reserved for the exponent notation), and
`registerToken` throws if you try. Anything else is up to you; UPPERCASE names for constants
and lowercase for operators and variables is the recommended convention.

## Development

```bash
npm install
npm test           # jest
npm run build      # compiles to dist/ with type declarations
```

## License

MIT
