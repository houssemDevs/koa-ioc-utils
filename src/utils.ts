import { ControllerMetadata, MethodMetadata } from '@/types';
import { METADATA_KEYS } from './constants';

export const getControllersFromMetadata = (): ControllerMetadata[] => {
  const controllersMetadataMap: Map<string, ControllerMetadata> =
    Reflect.getMetadata(METADATA_KEYS.controller, Reflect) ||
    new Map<string, ControllerMetadata>();
  const result: ControllerMetadata[] = [];
  controllersMetadataMap.forEach((c) => result.push(c));
  return result;
};

export const getMethodsMetadataFromController = (
  controller: Function,
): MethodMetadata[] => {
  const methodsMetadataMap: Map<string, MethodMetadata> =
    Reflect.getMetadata(METADATA_KEYS.method, controller) ||
    new Map<string, MethodMetadata>();
  const result: MethodMetadata[] = [];
  methodsMetadataMap.forEach((mm) => result.push(mm));
  return result;
};

export const getControllerNamefromInstance = (c: any): string => {
  return Object.getPrototypeOf(c).constructor.name;
};

export const getControllerMetadataByName = (
  name: string,
): ControllerMetadata => {
  const controllersMetadataMap: Map<string, ControllerMetadata> =
    Reflect.getMetadata(METADATA_KEYS.controller, Reflect) || new Map();
  const metadata = controllersMetadataMap.get(name);
  if (metadata) {
    return metadata;
  } else {
    throw new Error(`No controller metadata for name ${name}`);
  }
};
