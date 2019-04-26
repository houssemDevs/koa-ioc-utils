import { Container } from 'inversify';

import { INVERSIFY } from './constants';

/**
 * get instances of all the decorated controller from an inversify container.
 * @param container Inversify container from which controllers are extracted.
 */
export const getControllersFromContainer = (container: Container): any[] => {
  try {
    return container.getAll(INVERSIFY.CONTROLLER);
  } catch (err) {
    throw new Error(`no controller defined in container ${err}`);
  }
};
