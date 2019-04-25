import { METADATA_KEYS } from '@/constants';
import { ControllerMetadata, KoaMiddleware } from '@/types';

export const controller = (path: string, ...middlewares: KoaMiddleware[]): ClassDecorator => {
  return (target: Function) => {
    const newMetadata: ControllerMetadata = {
      name: target.name,
      controller: target,
      middlewares,
      path,
    };

    const currentMetadata =
      Reflect.getMetadata(METADATA_KEYS.controller, Reflect) || new Map<string, ControllerMetadata>();

    currentMetadata.set(newMetadata.name, newMetadata);

    Reflect.defineMetadata(METADATA_KEYS.controller, currentMetadata, Reflect);
  };
};
