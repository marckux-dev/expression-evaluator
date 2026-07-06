/**
 * Common shape of the evaluators: take an expression string, return its
 * numeric value. Useful to swap notations (standard/RPN) behind a single
 * dependency.
 */
export interface EvaluatorInterface {
  execute: (expression: string) => number;
}
