import { Container } from 'inversify';

import { TYPES } from '@/inversify/constants';

/**
 * get instances of all the decorated controller from an inversify container.
 * @param container Inversify container from which controllers are extracted.
 */
export const getControllersFromContainer = (container: Container): any[] => {
  return container.getAll(TYPES.controller) || [];
};
