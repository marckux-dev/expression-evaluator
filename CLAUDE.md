# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@marckux-dev/expression-evaluator` — a zero-runtime-dependency npm **library** (TypeScript) that
safely evaluates math expressions in standard infix notation (`3 + 4 * (2 - 1)`) or RPN, and is
extensible with user-defined operators and constants. It was extracted from a Udemy course
project (`~/web/udemy/typescript/evaluator`); that repo keeps the application shell (CLI/web
servers), this one is only the core. This is a library, not an app: there is no entry-point
executable, no server, no `.env`.

## Commands

```bash
npm test                 # run all tests (jest)
npm run test:watch       # watch mode
npm run test:coverage    # coverage run
npx jest path/to.test.ts # run a single test file
npx jest -t "name"       # run tests matching a name pattern

npm run build            # rimraf dist && tsc -p tsconfig.build.json (emits .js + .d.ts)
npm pack                 # build a local tarball to inspect/install elsewhere
```

There is no lint script. `strict: true` in tsconfig. Two tsconfigs: `tsconfig.json` (dev/tests)
and `tsconfig.build.json` (adds `declaration: true`, excludes `**/*.test.ts`).

Publishing: `npm publish --access public` (scoped package). `prepublishOnly` runs tests + build
automatically. `files: ["dist"]` in package.json controls what ships — only compiled output
(plus README/LICENSE/package.json).

## Public API

`src/index.ts` is the single public entry point (`main`/`types` point at its compiled output).
It exposes:

- `evaluate(expression)` / `evaluateRpn(expression)` — convenience functions, the primary API.
- `EvaluateStandardExpressionUsecase`, `EvaluateRpnExpressionUsecase`, `EvaluatorInterface`.
- `InvalidExpressionError`, `ValueError` — typed errors consumers catch with `instanceof`.
- Extension points: `OperatorEntity` (+ `OperatorEntityOptions`, `OperatorPosition`,
  `OperatorAssociativity`), `ConstantEntity`, `TokenInterface`, `TokenMapper`.

Anything not exported from `src/index.ts` is internal. When adding features, decide explicitly
whether they belong in the public surface; breaking changes to these exports require a major
version bump (semver).

Known design constraint: `TokenMapper` is a **singleton**, so operators/constants registered by
a consumer (via `TokenMapper.getInstance().registerToken(...)`) are process-global. Acceptable
for now; the first candidate refactor if per-evaluator token sets are ever needed. It also
means jest tests that register tokens can leak them into other tests in the same file.

## Architecture

Two layers under `src/`:

- `domain/entities` — pure evaluation model, no I/O.
- `application` — builders/mappers/usecases that turn a raw string into a domain
  `ExpressionEntity` and evaluate it.

### Token model (domain/entities)

Everything the evaluator manipulates implements `TokenInterface` (`getSymbol()`):

- `ConstantEntity` — a numeric value.
- `OperatorEntity` — configured via `OperatorEntityOptions` (symbol, `operation`, optional
  `validation`, `precedence`, `position`: PREFIX/INFIX/POSTFIX, `associativity`: LEFT/RIGHT).
  Number of operands is inferred from `operation.length`; operands arrive in reverse order
  (popped from a stack — see `pow.operator.ts`). Setting `this.numberOfOperands = 0` after
  `super(...)` makes an operator variadic (collects until an EOF sentinel — see
  `max.operator.ts`). Concrete operators live in `domain/entities/operators/`, one file per
  operator.
- `ControllerEntity` — structural, non-value tokens: `(`, `)`, `,`, and `EofController`
  (sentinel used by variadic operators to know when to stop popping operands).
- `ConstantEntity` subclasses in `domain/entities/constants/` (`PI`, `E`).

Built-in tokens are **auto-registered**: `tokens.register.ts` bulk-registers every export from
`operators/`, `constants/`, and `controllers/` via `Object.values(...)` into the `TokenMapper`
singleton (`application/mappers/token.mapper.ts`), which maps a symbol string to its token
class. Adding a built-in operator = new file + export in `operators/index.ts`, nothing else.
This is why each token is its own file with a default-constructible class (`new TokenClass()`).
Exception: `ImplicitMultiplicationOperator` is deliberately **not** exported from the barrel —
it is builder-inserted only, and registering it would clobber `*` in the mapper.

Precedence references: `+`/`-` binary 10, `*`/`/` 20, prefix functions (`sin`, `sqrt`,
`max`) 85, unary `+`/`-` 90, `^` and `!` 95.

### Evaluation pipeline

1. `FormatterUsecase.execute` — regex-based tokenizing prep: inserts spaces around
   symbols/words so the expression can be `split(' ')`.
2. `ExpressionBuilder.tokenize()` — maps each string piece to a `TokenInterface` (numbers
   become `ConstantEntity`, everything else looked up via `TokenMapper`).
3. For standard (infix) expressions, `StandardExpressionBuilder` (extends `ExpressionBuilder`)
   adds:
   - `manageImplicitMultiplication()` — inserts `ImplicitMultiplicationOperator` (precedence
     85, RIGHT — behaves like the prefix-function chain: `2 sin PI` = `2*sin(PI)`,
     `sin 2 PI` = `sin(2*PI)`) between operand-ending and operand-starting tokens (`2PI`,
     `(1+2)(3+4)`, `3!2`). A number after a number/constant throws ("Missing operator
     between…"). Spec: `implicit-multiplication.usecase.test.ts`.
   - `manageOperatorOverload()` — disambiguates `+`/`-` as unary (`PositiveOperator`/
     `NegationOperator`) vs binary based on the preceding token.
   - `toRpn()` — shunting-yard conversion to RPN, using bracket nesting (`level`, in steps of
     `MAX_OPERATOR_PRECEDENCE + 1` = 1000 added to precedence) to handle parens, and operator
     precedence/associativity/position for ordering. POSTFIX operators (e.g. factorial `!`)
     go straight to the output stack. A comma flushes the current argument's pending
     operators (keeps variadic arguments isolated).
4. `ExpressionEntity.evaluate()` — executes RPN tokens against a stack: constants/controllers
   get pushed, operators call `execute(stack)` which pops operands (respecting `EofController`
   for variadic operators), runs `validation` then `operation`, and pushes a new
   `ConstantEntity`.
5. `ExpressionEntity.getValue()` — asserts evaluation collapsed to exactly one
   `ConstantEntity` and returns its numeric value; throws `InvalidExpressionError` otherwise.

Errors are domain-specific: `InvalidExpressionError` (malformed expression/brackets/unknown
symbol) and `ValueError` (e.g. factorial of a negative or non-integer), both in
`domain/entities/errors/`.
