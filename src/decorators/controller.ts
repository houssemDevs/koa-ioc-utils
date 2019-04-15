import { METADATA_KEYS } from '@/constants';
import { ControllerMetadata, KoaMiddleware } from '@/types';

export function controller(
  path: string,
  ...middlewares: KoaMiddleware[]
): ClassDecorator {
  return function(target: Function) {
    const newMetadata: ControllerMetadata = {
      name: target.name,
      controller: target,
      middlewares,
      path,
    };

    const currentMetadas =
      Reflect.getMetadata(METADATA_KEYS.controller, Reflect) ||
      new Map<string, ControllerMetadata>();

    currentMetadas.set(target.name, newMetadata);

    Reflect.defineMetadata(METADATA_KEYS.controller, currentMetadas, Reflect);
  };
}
