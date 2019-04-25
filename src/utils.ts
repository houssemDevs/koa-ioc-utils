import { ControllerMetadata, ControllersMetadata, MethodMetadata, MethodsMetadata } from '@/types';
import { METADATA_KEYS } from './constants';

export const getControllersFromMetadata = (): ControllersMetadata =>
  Reflect.getMetadata(METADATA_KEYS.controller, Reflect) || new Map<string, ControllerMetadata>();

export const getMethodsMetadataFromController = (controller: Function): MethodsMetadata => {
  const methodsMetadataMap: Map<string, MethodMetadata> = Reflect.getMetadata(METADATA_KEYS.method, controller);
  if (methodsMetadataMap) {
    return methodsMetadataMap;
  }
  throw new Error(`no methods defined on controller ${controller.name}`);
};

export const getObjectName = (c: any): string => {
  return c.constructor.name;
};

export const getControllerMetadataByName = (name: string): ControllerMetadata => {
  const controllersMetadataMap: Map<string, ControllerMetadata> =
    Reflect.getMetadata(METADATA_KEYS.controller, Reflect) || new Map();
  const metadata = controllersMetadataMap.get(name);
  if (metadata) {
    return metadata;
  } else {
    throw new Error(`No controller metadata for name ${name}`);
  }
};
