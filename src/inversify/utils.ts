import { Container } from 'inversify';

import { TYPES } from '@/inversify/constants';

export const getControllersFromContainer = (container: Container): any[] => {
  return container.getAll(TYPES.controller) || [];
};
