
export class FormatterUsecase {

  execute(expression: string): string {
    // add a space before and after non-alphanumeric characters and not a dot not underscore
    expression = expression.replace(/([^a-zA-Z0-9._])/g, ' $1 ');
    // add a space before and after any alphabetic sequence or underscore
    expression = expression.replace(/([a-zA-Z_]+)/g, ' $1 ');
    // trim the expression
    expression = expression.trim();
    // remove any extra spaces
    expression = expression.replace(/\s+/g, ' ');
    return expression;
  }
}