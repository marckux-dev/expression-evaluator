import {TokenMapper} from "./token.mapper";
import * as operators from '../../domain/entities/operators';
import * as constants from '../../domain/entities/constants';
import * as controllers from '../../domain/entities/controllers';

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
