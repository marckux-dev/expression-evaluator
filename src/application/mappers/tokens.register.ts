import {TokenMapper} from "./token.mapper";
import * as operators from '../../domain/entities/operators';
import * as constants from '../../domain/entities/constants';
import * as controllers from '../../domain/entities/controllers';

/**
 * Bulk-registers every built-in token in the mapper. It iterates the
 * barrel exports of `operators/`, `constants/` and `controllers/`, so
 * adding a built-in token is just: create its file, export it from the
 * corresponding `index.ts`, done. This requires every token class to be
 * constructible with no arguments.
 */
export function tokensRegister(tokenMapper: TokenMapper) {
  Object.values(operators).forEach((operator) => {
    tokenMapper.registerToken(operator);
  });

  Object.values(constants).forEach((constant) => {
    tokenMapper.registerToken(constant);
  });

  Object.values(controllers).forEach((controller) => {
    tokenMapper.registerToken(controller);
  })
}
