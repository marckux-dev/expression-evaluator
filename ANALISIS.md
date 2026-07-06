# Análisis del proyecto — `@marckux/expression-evaluator`

**Versión analizada:** 0.1.0 (previa a la primera publicación en npm)
**Fecha:** 2026-07-06
**Metodología:** lectura completa del código fuente, verificación empírica de casos límite
contra la build de `dist/` (script reproducible), medición de cobertura y rendimiento, y
comparativa con la competencia usando datos en vivo del registro de npm, bundlephobia y
avisos de seguridad públicos.

---

## 1. Resumen ejecutivo

El proyecto está **listo para publicarse como 0.1.0**: hace bien lo que promete, tiene una
cobertura de tests del ~98 %, cero dependencias, documentación JSDoc que viaja en los `.d.ts`
y un tamaño de ~8 kB gzip. La arquitectura en dos capas (dominio puro + aplicación) es limpia
y su punto fuerte real es la **extensibilidad**: la calculadora de demostración añadió 6
operadores y una constante en ~100 líneas sin tocar la librería.

El análisis empírico ha destapado **un bug real** (una expresión RPN malformada podía devolver
`NaN` en vez de lanzar error — ya corregido, junto con el rechazo explícito de paréntesis y
comas en modo RPN, ver §4.1) y **una invariante frágil sin documentar** (precedencias
personalizadas ≥ 100 rompen los paréntesis silenciosamente, §4.2). Ninguno bloquea la
publicación de una 0.1.0 —son casos límite—, pero la invariante debe encabezar la 0.2.0.

Nota: el cierre implícito de paréntesis sin cerrar (`3-(2*(3+4` se evalúa como `3-(2*(3+4))`
= -11) **no es un bug**, es el comportamiento esperado del algoritmo shunting-yard usado —
ver la aclaración en §4.0 y el comentario correspondiente en el código.

En cuanto al mercado: no competimos con mathjs (el "todo incluido" de 197 kB gzip), sino en el
nicho de evaluadores **pequeños, seguros y mantenidos**. Y ese nicho tiene hoy un vacío
notable: `expr-eval`, la referencia histórica con 458 k descargas semanales, está abandonada
desde 2019 y arrastra **dos CVEs de 2025 sin parche** (ejecución de código arbitrario y
prototype pollution). Las carencias que nos separan de esa categoría son concretas: variables
(`evaluate('2x+1', {x:3})`), una API `compile()` y más funciones integradas. Ese es el corazón
del plan de mejoras (§8).

---

## 2. Inventario funcional (qué hace hoy)

### 2.1 API pública

| Export | Tipo | Función |
| --- | --- | --- |
| `evaluate(expr)` | función | Evalúa notación infija estándar. API principal. |
| `evaluateRpn(expr)` | función | Evalúa notación polaca inversa (tokens separados por espacios). |
| `EvaluateStandardExpressionUsecase`, `EvaluateRpnExpressionUsecase` | clases | Las mismas capacidades, instanciables/inyectables. |
| `EvaluatorInterface` | interfaz | Contrato común para inyectar cualquiera de las dos. |
| `InvalidExpressionError`, `ValueError` | errores | Tipados, capturables con `instanceof`. |
| `OperatorEntity` (+ `Options`, `Position`, `Associativity`), `ConstantEntity`, `TokenInterface`, `TokenMapper` | extensión | Registro de operadores y constantes propios. |

### 2.2 Tokens integrados

| Símbolo | Aridad | Precedencia | Posición | Asociatividad | Validación |
| --- | --- | --- | --- | --- | --- |
| `+` `-` | 2 | 10 | INFIX | LEFT | — |
| `*` | 2 | 20 | INFIX | LEFT | — |
| `/` | 2 | 20 | INFIX | LEFT | división por 0 → `ValueError` |
| `sin` `cos` `sqrt` | 1 | 85 | PREFIX | RIGHT | `sqrt`: negativo → `ValueError` |
| `max` | variádica | 85 | PREFIX | RIGHT | ≥ 1 operando |
| `pos` `neg` (los `+`/`-` unarios) | 1 | 90 | PREFIX | RIGHT | — |
| `^` | 2 | 95 | INFIX | RIGHT | — |
| `!` | 1 | 95 | POSTFIX | RIGHT | entero ≥ 0 |

Constantes: `PI`, `E`. Controladores estructurales: `(`, `)`, `,`, `_EOF` (centinela interno
de los variádicos). Las tres funciones prefijas (`sin`/`cos`/`sqrt`) comparten hoy
`PREFIX`+`RIGHT` — la inconsistencia que señalaba una versión anterior de este análisis (§4.3)
ya no existe en el código.

### 2.3 Semántica verificada empíricamente

Todo lo siguiente se comprobó ejecutando contra `dist/` (no solo leyendo el código):

| Expresión | Resultado | Comentario |
| --- | --- | --- |
| `-3 ^ 2` | `-9` | Convención matemática correcta (`^` liga más que el unario). |
| `2 ^ 3 ^ 2` | `512` | Asociatividad derecha correcta. |
| `2 ^ 3!` | `64` | Postfijo liga más que `^`. |
| `3!!`, `--5` | `720`, `5` | Encadenados correctos. |
| `5! - 3` | `117` | El bug histórico unario/binario tras postfijo está corregido y testeado. |
| `.5 + .5` | `1` | Decimales sin cero inicial aceptados. |
| `sin sin 0`, `sqrt sqrt 16` | `0`, `2` | Funciones prefijas encadenadas sin paréntesis funcionan, incluida `sqrt` (§4.3). |
| `max(1, 5, 3)` | `5` | Variádicos en infija correctos. La coma es decorativa: `max(1 5 3)` equivale. |
| `10 / 0`, `sqrt(-1)`, `(-3)!` | `ValueError` | Dominio validado (decisión de diseño: mathjs devolvería `Infinity` en `10/0`). |
| `2PI`, `2(3+4)` | `InvalidExpressionError` | No hay multiplicación implícita (rechazo limpio). |
| `''`, `'   '` | `InvalidExpressionError` | Expresión vacía rechazada. |

### 2.4 Métricas de calidad y rendimiento

- **Tests:** 7 suites, 32 tests, todos en verde. Cobertura: 100 % en `application/usecases`,
  ~98,8 % en `domain/entities`, 96,7 % sentencias / 80 % ramas en `operators`. Huecos
  concretos en §6.3.
- **Rendimiento** (WSL2, Node local): ~55 000 evaluaciones/s del pipeline completo con
  `3 + 4 * (2 - 1) - sin(PI / 2)`; una expresión de 8 000 términos se evalúa en 26 ms con
  escalado aproximadamente lineal. Sobrado para su caso de uso (fórmulas de usuario).
- **Tamaño:** tarball 18,0 kB; 68,4 kB desempaquetado; ~44 kB de JS que comprimen a
  **~8 kB gzip** (sin minificar). Cero dependencias de runtime.
- **Seguridad:** no hay `eval`/`new Function`; el registro de tokens es un `Map` (inmune a
  lookups tipo `__proto__`/`constructor` que han comprometido a la competencia, §7); las
  regex del formateador son lineales (sin backtracking catastrófico → sin ReDoS).

---

## 3. Análisis de la arquitectura

### 3.1 Estructura y flujo

```
src/
├── domain/entities/        ← modelo de evaluación puro, sin I/O
│   ├── operators/  constants/  controllers/  errors/
│   ├── operator.entity.ts   constant.entity.ts   controller.entity.ts
│   ├── expression.entity.ts (ejecución RPN contra una pila)
│   └── token.interface.ts
└── application/            ← orquestación string → dominio
    ├── builders/   (ExpressionBuilder, StandardExpressionBuilder)
    ├── mappers/    (TokenMapper singleton + auto-registro)
    └── usecases/   (evaluadores, formatter)
```

Pipeline infijo: `FormatterUsecase` (espaciado por regex) → `tokenize()` (mapa símbolo→token)
→ `manageOperatorOverload()` (desambigua `+`/`-` unarios) → `toRpn()` (shunting-yard) →
`ExpressionEntity.evaluate()` (pila) → `getValue()`.

La **dirección de dependencias es correcta**: `domain` no importa nada de `application`;
`application` depende de `domain`. El dominio es testeable en aislamiento.

### 3.2 Patrones empleados

- **Builder encadenado** (`tokenize().manageOperatorOverload().toRpn().build()`) — legible,
  aunque expone el orden correcto como responsabilidad del llamante (§3.4.6).
- **Singleton** (`TokenMapper`) — registro global de proceso; cómodo y a la vez la mayor
  limitación arquitectónica (§3.4.1).
- **Strategy** — `operation`/`validation` inyectadas por opciones en `OperatorEntity`; los
  operadores concretos son subclases de configuración de una sola responsabilidad.
- **Auto-registro por barrels** — `tokens.register.ts` itera los `export *` de
  `operators/`, `constants/` y `controllers/`: añadir un token integrado = crear su fichero y
  exportarlo. Elegante y con un requisito implícito razonable (constructores sin argumentos).

### 3.3 Fortalezas

1. **Extensibilidad demostrada.** El caso real (calculadora de prueba): `mod`, `tan`, `ln`,
   `log`, `abs`, `min` variádico y `PHI` en ~100 líneas de código de consumidor, sin fork.
   El modelo posición/asociatividad/precedencia/validación cubre operadores no triviales
   (postfijos, variádicos, dominios restringidos).
2. **Dominio puro y pequeño.** ~1 000 líneas de fuente en total; cada token en su fichero;
   se puede leer entero en una sentada. Valor pedagógico alto.
3. **Errores tipados y honestos** — distinguen sintaxis (`InvalidExpressionError`) de dominio
   (`ValueError`), pensados para mostrarse al usuario final.
4. **Seguridad estructural** (ver §2.4): la superficie de ataque típica de esta categoría
   simplemente no existe aquí.
5. **DX del paquete**: JSDoc en los `.d.ts`, `exports` con `types`, `sideEffects: false`
   (correcto: el registro ocurre en el constructor perezoso del singleton, no como efecto de
   módulo), `prepublishOnly` con tests+build.

### 3.4 Debilidades

1. **Singleton global** (`TokenMapper`). Estado compartido de proceso: dos partes de una misma
   app no pueden tener vocabularios distintos; los tests que registran tokens contaminan a los
   demás (ya documentado en CLAUDE.md). Es la refactorización candidata número 1 (§8, fase 3).
2. **La invariante `level += 100` no se protege.** `toRpn()` simula los paréntesis sumando 100
   a la precedencia por nivel de anidamiento. Funciona porque todas las precedencias internas
   son ≤ 95, pero **nada valida ni documenta el límite**: un consumidor que registre
   `precedence: 150` obtiene resultados silenciosamente incorrectos (verificado, §4.2). La
   invariante segura es `precedence ∈ [1, 99]`.
3. **Mutación de precedencia durante el parseo.** `toRpn()` llama a `token.setPrecedence(p +
   level)` sobre el token. No hay bug hoy (cada parseo crea instancias frescas), pero es
   acoplamiento temporal frágil y obliga a que `precedence` sea público y mutable.
4. **El formateador destruye las posiciones.** El enfoque regex-espacios-`split(' ')` es
   ingenioso y simple, pero pierde el offset original de cada token: los errores no pueden
   señalar columna, y la tokenización no puede tratar `1e5` (notación científica) ni
   multiplicación implícita. Un lexer real de una pasada es la mejora arquitectónica que
   desbloquea las tres cosas a la vez.
5. **`PREFIX`/`INFIX` no se distinguen en la práctica** — el algoritmo solo trata especial a
   `POSTFIX`, así que ambos valores son intercambiables en cuanto al resultado. Los integrados
   ya son consistentes entre sí (`sin`/`cos`/`sqrt`/`max` son todos `PREFIX`+`RIGHT`, §4.3),
   pero la distinción sigue sin tener efecto real en el algoritmo — es documentación por
   convención, no una restricción que aplique el código.
6. **Aridad 0 = variádico** es un valor mágico con un efecto colateral: una `operation`
   definida con rest params (`(...ns) => …`) tiene `length === 0` y se vuelve variádica sin
   que el autor lo pida. Una opción explícita `variadic: true` sería más honesta.
7. **El modo RPN es parcialmente un ciudadano de segunda**: los operadores variádicos siguen
   siendo inutilizables desde RPN puro (nada inserta el centinela `_EOF`); el consumo silencioso
   de tokens estructurales ya está corregido (§4.1) rechazándolos explícitamente.
8. **Nombres menores:** `FormatterUsecase` no es un caso de uso (es un servicio de
   tokenización); `ControllerEntity` es instanciable cuando debería ser abstracta; hay un
   `export  class` con doble espacio en `operator.entity.ts`.

---

## 4. Defectos verificados (con reproducción)

Todos comprobados ejecutando contra la build actual:

### 4.0 Comportamiento esperado: cierre implícito de paréntesis — no es un bug

```ts
evaluate('3-(2*(3+4')   // → -11  (equivale a 3-(2*(3+4)) )
evaluate('((1+2)*3')    // → 9
evaluate('3 + 4)')      // → InvalidExpressionError ✓ (el caso inverso sí se detecta)
```

`toRpn()` solo usa `(` para sumar 100 a la precedencia de los operadores que contiene; el
propio paréntesis nunca llega a la salida. Por eso, al final de la conversión, los operadores
pendientes se vuelcan igual sin importar cuántos `(` quedaron sin cerrar — la expresión se
comporta como si todos se hubieran cerrado justo ahí. Solo un `)` **de más** es un error real,
porque hace que `level` sea negativo. Se ha documentado esta intención en un comentario en
`standard.expression.builder.ts` y se han añadido tests que fijan el comportamiento
(`evaluate-standard-expression.usecase.test.ts`).

### 4.1 RPN malformado podía devolver `NaN` en vez de error — **corregido**

```ts
evaluateRpn('3 ( +')  // antes → NaN; ahora → InvalidExpressionError
```

Causa raíz: `OperatorEntity.execute()` hace `pop()` y, si el token no es `ConstantEntity` ni
`_EOF`, lo ignoraba pero decrementaba igualmente el contador de operandos; la operación acababa
ejecutándose con `undefined`. En vez de tocar `execute()` (que es compartido con el modo
infijo), se ha atajado en el origen: **el modo RPN no necesita paréntesis ni comas** — la
notación polaca inversa codifica el agrupamiento únicamente mediante el orden de los tokens —
así que `EvaluateRpnExpressionUsecase` ahora rechaza explícitamente cualquier `(`, `)` o `,`
en la entrada con `InvalidExpressionError`, antes de que puedan llegar a `execute()` y disparar
el bug. Ver tests en `evaluate-rpn-expression.usecase.test.ts`.

### 4.2 Precedencias personalizadas ≥ 100 rompen los paréntesis — **gravedad media** (afecta solo a extensiones)

```ts
// Operador 'T' registrado con precedence: 150, operación resta
evaluate('10 T (2 + 3)')  // → 11   (debería ser 10 - 5 = 5)
```

Causa: la debilidad §3.4.2. Arreglo corto: validar `1 ≤ precedence ≤ 99` en el constructor de
`OperatorEntity` (error inmediato y claro en vez de resultados corruptos) y documentar el
rango en README/JSDoc. Arreglo definitivo: shunting-yard canónico (fase 3).

### 4.3 `sqrt` encadenada sin paréntesis — **ya corregido en el código actual**

Este análisis se escribió contra un build en el que `sqrt` tenía asociatividad LEFT por
defecto (sus hermanas `sin`/`cos` son RIGHT), lo que expulsaba a la primera `sqrt` de la pila
antes de que existiera su operando:

```ts
evaluate('sin sin 0')     // → 0 ✓
evaluate('sqrt sqrt 16')  // → antes: InvalidExpressionError ("not enough operands")
evaluate('sqrt(sqrt(16))')// → 2 ✓
```

El código fuente ya tiene `sqrt` alineada con `sin`/`cos` (`PREFIX` + `RIGHT` en
`square-root.operator.ts`), así que `evaluate('sqrt sqrt 16')` devuelve `2` correctamente.
Se han añadido tests de regresión con varias combinaciones de funciones prefijas encadenadas
(mismo tipo y mixtas, con y sin paréntesis) en
`evaluate-standard-expression.usecase.test.ts`.

### 4.4 Notación científica: error confuso — **gravedad baja**

```ts
evaluate('1e5')       // → InvalidExpressionError: "e is not a valid operator or constant"
evaluate('2.5e-3 + 1')// → ídem
```

El tokenizador separa `1e5` en `1`, `e`, `5` y el mensaje culpa a una `e` que el usuario no
escribió (y que además colisiona con la constante de Euler `E`). O se soporta la notación
científica (deseable) o al menos se mejora el mensaje.

### 4.5 Menores

- `Infinity + 1` → `Infinity`: `Number('Infinity')` cuela `Infinity` como literal válido.
  Decidir si es feature (documentar) o filtrar.
- Mensaje `"The evaluated expression gets more than one token"`: gramática mejorable
  ("yields"/"evaluates to") y es el cajón de sastre que recibe desde `sin(1, 2)` (aridad
  incorrecta) hasta `2PI` (yuxtaposición). Mensajes más específicos ayudarían.
- Ningún error informa de la posición (columna) del problema (§3.4.4).

---

## 5. Mejoras de código propuestas (sin cambiar el API)

1. **Corregir §4.2 y §4.4** — caben en una tarde y son compatibles hacia atrás (estrictamente:
   convierten resultados incorrectos en errores, que es la dirección segura). §4.1 y §4.3 ya
   están corregidos.
2. **Nombrar la constante mágica**: `const BRACKET_PRECEDENCE_STEP = 100` en el builder, con
   el comentario de la invariante.
3. **Eliminar la mutación de precedencia**: calcular la precedencia efectiva (`prec + level`)
   en variables locales del algoritmo (p. ej. apilando pares `{op, effPrec}`), y retirar
   `setPrecedence` del API público de `OperatorEntity`.
4. **`ControllerEntity` abstracta**; refactor cosmético del bucle pop/re-push de `toRpn()` a
   un `peek` explícito; unificar comillas/indentación (hay mezcla de 2 y 4 espacios).
5. **Cerrar los huecos de cobertura** (los señala `jest --coverage`):
   - la rama `validation` que **devuelve `false`** (operator.entity.ts:166) — todos los tests
     actuales validan lanzando, ninguno devolviendo `false`;
   - el operador `pos`: no existe ningún test que evalúe `+5`;
   - el camino de éxito de `sqrt`: se testea `sqrt(-1)` pero ninguna evaluación correcta.
6. **Tooling**: ESLint + Prettier (hoy no hay lint) y **CI en GitHub Actions** (matriz Node
   18/20/22: test + build + coverage). El repo remoto ya existe; no hay `.github/`.
7. **Tests basados en propiedades** (fast-check como devDependency): generar expresiones
   aleatorias bien formadas y comparar contra un oráculo; es la red de seguridad ideal antes
   de refactorizar el parser (fase 3).

---

## 6. Nuevas funcionalidades propuestas (priorizadas)

### P1 — Paridad básica con la categoría (alto valor / bajo esfuerzo)

1. **Ampliar la biblioteca estándar**: `tan`, `ln`, `log`, `abs`, `min`, `floor`, `ceil`,
   `round`, `exp` y `mod` (o `%`). La evidencia es interna: la calculadora de demostración
   tuvo que definir 6 de ellos a mano. Con la infraestructura actual son ~10 ficheros
   triviales + export.
2. **Notación científica** en literales (`1e5`, `2.5e-3`).
3. **Mensajes de error con posición** aproximada del token conflictivo.

### P2 — Diferenciadores (el salto de calidad)

4. **Variables/scope** — la funcionalidad más demandada de la categoría y nuestra mayor
   carencia comparativa:
   ```ts
   evaluate('2 * x + 1', { x: 3 }); // 7
   ```
   Diseño posible sin tocar el singleton: el builder recibe un scope efímero y resuelve los
   identificadores desconocidos contra él antes de consultar el `TokenMapper`.
5. **API `compile()`** — parsear una vez, evaluar N veces (lo ofrecen expr-eval y mathjs):
   ```ts
   const area = compile('PI * r ^ 2');
   area({ r: 1 }); // 3.14159…
   area({ r: 2 }); // 12.56637…
   ```
   Encaja de forma natural: `compile` devuelve la `ExpressionEntity` (RPN ya construido)
   envuelta en una closure que sustituye variables.
6. **Registro sin subclases** — reducir el boilerplate de extensión:
   ```ts
   defineOperator({ symbol: 'mod', operation: (a, b) => b % a, precedence: 20 });
   defineConstant('PHI', (1 + Math.sqrt(5)) / 2);
   ```

### P3 — Horizonte (evaluar demanda antes de construir)

7. **Evaluadores por instancia** (`createEvaluator()`) con registro aislado; el singleton
   queda como fachada de compatibilidad. (Es a la vez mejora arquitectónica — §3.4.1.)
8. **Multiplicación implícita opcional** (`2PI`, `2(3+4)`) tras el lexer nuevo, bajo flag.
9. **Exponer el RPN/AST** (`toRpnString()`, recorrido del árbol) para depuración y tooling.
10. **Pack opcional de comparadores/booleanos** (`>`, `<`, `==`, `and`, `or`) orientado a
    rule engines — solo si aparece demanda; ensancha el alcance del proyecto.
11. **Dual ESM/CJS** (hoy solo CommonJS; con `exports` condicional o tsup) y `engines` a
    `>=18` (Node 14 está EOL desde 2023) — para la 1.0.

---

## 7. Comparativa con la competencia (datos del 2026-07-06)

Descargas semanales de api.npmjs.org (semana 2026-06-29 → 2026-07-05); tamaños del registro
npm y bundlephobia.

| Paquete | Desc./sem | Última publicación | Tamaño | Estado |
| --- | --- | --- | --- | --- |
| **mathjs** 15.2 | 2,74 M | 2026-04 | 9,4 MB unpacked · ~197 kB min+gzip | ✅ Activo. El estándar "todo incluido": unidades, matrices, complejos, bignumber, álgebra simbólica. |
| **math-expression-evaluator** 2.0.7 | 2,57 M | 2025-06 | 68 kB | 🟡 Mantenimiento esporádico. Descargas infladas por uso transitivo. |
| **jsep** 1.4 | 10,3 M | 2024-11 | 392 kB | ✅ Activo, pero **solo parser** (produce AST, no evalúa). Otra categoría. |
| **expr-eval** 2.0.2 | 458 k | **2019** | 146 kB · 7,5 kB min+gzip | 🔴 Abandonado. **CVE-2025-12735 (ejecución de código) y CVE-2025-13204 (prototype pollution), sin versión corregida** — solo existe parche en el fork `expr-eval-fork` 3.0. |
| **expression-eval** 5.0.1 | 111 k | 2023 | 78 kB | 🔴 Deprecado explícitamente por su autor; inseguro para input de usuario. |
| **hot-formula-parser** 4.0 | 166 k | 2022 | 763 kB | 🔴 Abandonado (fórmulas estilo Excel). |
| **tinymath** 1.2.1 | 16 k | 2022 | 706 kB | 🔴 Deprecado (era de Elastic/Kibana). |
| **fparser** 4.2 | 8,4 k | 2025-12 | 215 kB | ✅ Activo; nicho pequeño, API de fórmulas con variables. |
| **@cortex-js/compute-engine** 0.68 | 205 k | 2026-07 | 52,8 MB | ✅ Muy activo; CAS completo con MathJSON. Peso pesado, otra categoría. |
| **@marckux/expression-evaluator** 0.1.0 | — | (pendiente) | 18 kB tarball · ~8 kB gzip | Este proyecto. |

### 7.1 Lectura del mercado

- **El nicho "pequeño + seguro + mantenido" está vacío.** De las opciones ligeras, las cuatro
  más conocidas están muertas o deprecadas, y la líder histórica (`expr-eval`) es hoy un
  riesgo de seguridad documentado con casi medio millón de descargas semanales que necesitan
  a dónde migrar. Es una ventana real para un paquete nuevo.
- **Contra mathjs no se compite; se complementa.** Su parser es excelente y seguro, pero pesa
  ~25× más (197 kB vs 8 kB gzip) y trae un universo que la mayoría de formularios/rule engines
  no necesita.
- **Cómo nos comparamos hoy, honestamente:**
  - *A favor:* cero dependencias, tamaño mínimo, TypeScript estricto con tipos de primera,
    errores tipados, extensibilidad más expresiva que la de expr-eval (posición, asociatividad,
    variádicos, validación de dominio), soporte RPN (rareza en la categoría), sin las clases de
    vulnerabilidad que mataron a la competencia, y mantenimiento vivo.
  - *En contra:* sin **variables/scope** ni **compile()** (lo ofrecen expr-eval, fparser y
    mathjs y es el caso de uso número 1: fórmulas parametrizadas), biblioteca de funciones más
    corta, sin comunidad ni track record (versión 0.1.0, 0 descargas), solo CommonJS.
- **Posicionamiento propuesto:** "el sustituto moderno y seguro de expr-eval para TypeScript".
  Objetivo realista para el primer año: ser útil, correcto y estar impecablemente documentado;
  las descargas son consecuencia, no meta.

---

## 8. Plan de mejoras escalonado

### Fase 0 — Publicar 0.1.0 (ya)

Sin cambios de código. Commit del estado actual, `npm publish` (con `prepublishOnly`
ejecutando tests+build), tag `v0.1.0`, y push del repo con este análisis.
*Racional:* es el primer paquete del autor; el flujo de publicación se aprende publicando. Los
defectos conocidos son casos límite documentados aquí y ninguno compromete el uso normal.

**Criterio de salida:** paquete visible en npmjs.com e instalable desde el registro.

### Fase 1 — 0.2.0 "Robustez" (1–2 sesiones)

- Bug §4.4 (mensaje de `1e5`). §4.1 (RPN→NaN / paréntesis y comas en RPN) y §4.3 (`sqrt`
  encadenada) ya están corregidos.
- Validar `precedence ∈ [1, 99]` en `OperatorEntity` (§4.2) y documentar el rango.
- Notación científica en el tokenizador.
- Tests de los huecos de cobertura (§5.5) + tests de regresión de cada bug.
- ESLint + Prettier + GitHub Actions (test/build/coverage en Node 18/20/22).

**Criterio de salida:** toda entrada inválida lanza error tipado (nada de resultados
silenciosos); CI en verde en el repo público.

### Fase 2 — 0.3.0 "Paridad y diferenciación" (2–4 sesiones)

- Biblioteca estándar ampliada (§6.1).
- **Variables/scope** y **`compile()`** (§6.4–6.5) — el salto de valor comparativo.
- `defineOperator`/`defineConstant` sin subclases (§6.6).
- Property-based testing con fast-check.
- README: sección de comparativa/benchmark y "por qué no expr-eval".

**Criterio de salida:** `compile('PI * r ^ 2')({r: 2})` funciona documentado en README; la
tabla de §7 deja de tener carencias en negrita.

### Fase 3 — 0.4.0 "Arquitectura" (refactor mayor, con la red de fase 2)

- Lexer real de una pasada con posiciones (sustituye `FormatterUsecase` + `split`).
- Shunting-yard canónico con pila de paréntesis (elimina la invariante del 100 y la mutación
  de precedencia).
- Errores con columna (`InvalidExpressionError.position`).
- `createEvaluator()` por instancia; el singleton pasa a fachada retrocompatible.
- Multiplicación implícita bajo flag (ahora es barato).

**Criterio de salida:** los tests de propiedades pasan idénticos antes y después del refactor;
ningún breaking change en los exports existentes.

### Fase 4 — 1.0.0 "Estabilización"

- Congelar el API público y adoptar semver estricto + CHANGELOG.
- Dual ESM/CJS; `engines: ">=18"`; publicación con provenance (`npm publish --provenance`).
- Sitio de documentación (typedoc) y demo pública (la calculadora de `prueba-evaluator` como
  playground).

**Criterio de salida:** un consumidor puede fijar `^1.0.0` con garantías.

---

## 9. Riesgos y decisiones abiertas

| Decisión | Estado actual | Recomendación |
| --- | --- | --- |
| `10 / 0` | `ValueError` | Mantener (es más útil para fórmulas de usuario que el `Infinity` de IEEE-754/mathjs), pero **documentarlo en el README** como decisión consciente. |
| Literal `Infinity` | Aceptado por accidente | Decidir en fase 1: o documentar como feature o rechazar. |
| Singleton `TokenMapper` | API pública | No romper: fachada sobre instancias en fase 3. |
| Rango de precedencias | Implícito (≤ 99) | Hacerlo explícito ya (validación + docs), fase 1. |
| Nombre scoped `@marckux/…` | — | Mantener. Menor descubribilidad que un nombre plano, pero evita colisiones y el squatting; la descubribilidad se gana con README y keywords. |
| Solo CommonJS | `module: commonjs` | Suficiente para 0.x (Node y todos los bundlers lo consumen); dual ESM/CJS en 1.0. |

---

## Apéndice — Fuentes y reproducibilidad

- Descargas: `api.npmjs.org/downloads/point/last-week/<pkg>` (consultado 2026-07-06).
- Tamaños min+gzip: [bundlephobia](https://bundlephobia.com) (mathjs, expr-eval).
- Vulnerabilidades de expr-eval:
  [CVE-2025-12735 (Snyk)](https://security.snyk.io/vuln/SNYK-JS-EXPREVAL-13833679),
  [CVE-2025-13204 (GitHub Advisory GHSA-8gw3-rxh4-v6jx)](https://github.com/advisories/GHSA-8gw3-rxh4-v6jx),
  [análisis de SentinelOne](https://www.sentinelone.com/vulnerability-database/cve-2025-13204/).
- Panorama de la categoría: [npm-compare: expr-eval vs jsep vs math-expression-evaluator vs mathjs](https://npm-compare.com/expr-eval,jsep,math-expression-evaluator,mathjs),
  [repo de expr-eval](https://github.com/silentmatt/expr-eval).
- Verificación empírica: los casos de §2.3 y §4 provienen de un script ejecutado contra
  `dist/` compilado desde este árbol (Node, WSL2). Cobertura: `npm run test:coverage`.
  Rendimiento: bucle de 20 000 evaluaciones con `process.hrtime.bigint()`.
