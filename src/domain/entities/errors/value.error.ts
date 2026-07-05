
export class ValueError extends Error {
  constructor(message: string = 'Value error') {
    super(message);
    this.name = 'ValueError';
    Object.setPrototypeOf(this, ValueError.prototype);
  }
}