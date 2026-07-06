# @marckux/expression-evaluator

Minimal, dependency-free and extensible math expression evaluator for TypeScript and JavaScript.
It safely evaluates expressions written by *users* (form fields, configurable formulas, rule
engines…) without ever touching `eval()`, and lets you register your own domain operators in a
few lines.

- **Zero runtime dependencies**, tiny footprint.
- Standard (infix) notation with the usual precedence, associativity and parentheses — plus RPN.
- Built-in: `+ - * / ^ !`, `sin`, `cos`, `sqrt`, variadic `max(...)`, constants `PI` and `E`.
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
```

Reverse Polish notation:

```ts
import { evaluateRpn } from '@marckux/expression-evaluator';

evaluateRpn('3 4 2 1 - * +'); // 7
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
| `position` | `PREFIX`, `INFIX` (default) or `POSTFIX` (like `!`). |
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

## Development

```bash
npm install
npm test           # jest
npm run build      # compiles to dist/ with type declarations
```

## License

MIT
