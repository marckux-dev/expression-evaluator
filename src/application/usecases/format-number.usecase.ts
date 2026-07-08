/**
 * Formats a number for display. Both limits are opt-in and independent:
 * with no parameters `execute()` is just `value.toString()` (full double
 * precision), `maxDecimals` collapses anything below its resolution to `0`
 * (useful against floating-point noise: `sin(PI)` → `1.22e-16` → `'0'`),
 * and `maxSignificantDigits` caps the digits shown.
 *
 * Purely presentational — the evaluators never round. The `formatNumber()`
 * convenience function wraps this class.
 */
export class FormatNumberUsecase {
  /**
   * @param maxDecimals Decimal places below which a value collapses to
   *   `0`. Omit to disable.
   * @param maxSignificantDigits Significant digits kept in the output.
   *   Omit to disable.
   */
  constructor(
    private maxDecimals?: number,
    private maxSignificantDigits?: number
  ) { }

  execute(value: number): string {
    let result = value;

    if (this.maxDecimals !== undefined) {
      const flooredToDecimals = Number(result.toFixed(this.maxDecimals));
      if (flooredToDecimals === 0) return '0';
      result = flooredToDecimals;
    }

    if (this.maxSignificantDigits !== undefined) {
      result = Number(result.toPrecision(this.maxSignificantDigits));
    }

    return result.toString();
  }
}
