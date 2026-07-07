export class FormatNumberUsecase {
  constructor(
    private maxDecimals: number = 12,
    private maxSignificantDigits: number = 12
  ) { }

  execute(value: number): string {
    const flooredToDecimals = Number(value.toFixed(this.maxDecimals));
    if (flooredToDecimals === 0) return '0';
    const result = Number(
      flooredToDecimals.toPrecision(this.maxSignificantDigits)
    );
    return result.toString();
  }
}
