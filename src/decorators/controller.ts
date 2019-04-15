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
      Reflect.getMetadata(METADATA_KEYS.controller, Reflect) || [];

    Reflect.defineMetadata(
      METADATA_KEYS.controller,
      [newMetadata, ...currentMetadas],
      Reflect,
    );
  };
}
