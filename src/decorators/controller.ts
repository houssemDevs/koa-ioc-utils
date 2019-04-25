import { Middleware } from 'koa';

import { METADATA_KEYS } from '../constants';
import { ControllerMetadata } from '../types';

/**
 * define metadata for the controller decorated on the Reflect global object.
 * @param path root path for this controller
 * @param middlewares koa middlewares that are run ahead of any of its methods.
 */
export const controller = (path: string, ...middlewares: Middleware[]): ClassDecorator => {
  return (target: Function) => {
    // this controller metdata.
    const newMetadata: ControllerMetadata = {
      name: target.name,
      controller: target,
      middlewares,
      path,
    };

    // metadatas of all controllers, make a clean map if not defined.
    const currentMetadata =
      Reflect.getMetadata(METADATA_KEYS.controller, Reflect) || new Map<string, ControllerMetadata>();

    currentMetadata.set(newMetadata.name, newMetadata);

    Reflect.defineMetadata(METADATA_KEYS.controller, currentMetadata, Reflect);
  };
};
