import {ConstantEntity} from "./constant.entity";

describe('constant.entity.ts', () => {
  it('should create a constant an get the value', () => {
    const testConstant = new ConstantEntity(10);
    const value = testConstant.getValue();
    expect(value).toBe(10);
  });

  it('should getSymbol return the value as string', () => {
    const testConstant = new ConstantEntity(10);
    const symbol = testConstant.getSymbol();
    expect(symbol).toBe('10');
  });
});