import {ControllerEntity} from "./controller.entity";

describe('controller.entity', () => {
  it ('should create a controller and get the symbol', () => {
    const symbol = 'spam';
    const controller = new ControllerEntity(symbol);
    expect(controller.getSymbol()).toBe(symbol);
  });
});