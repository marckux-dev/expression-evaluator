import {ControllerEntity} from "../controller.entity";

/**
 * Sentinel pushed to the output before a variadic operator's arguments;
 * tells the operator where to stop popping operands.
 */
export class EofController extends ControllerEntity {
  constructor() {
    super('_EOF');
  }
}