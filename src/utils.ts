import { METADATA_KEYS } from './constants';
import { ControllerMetadata, ControllersMetadata, MethodMetadata, MethodsMetadata, ParamsMetadata } from './types';

/**
 * get all the decorated controllers metadata, or an empty Array.
 */
export const getControllersFromMetadata = (): ControllersMetadata =>
  Reflect.getMetadata(METADATA_KEYS.controller, Reflect) || new Map<string, ControllerMetadata>();

/**
 * get all the methods metadata of a controller
 * @param controller controller constructor function from which methods metadata will be extracted.
 * @throw throw error if no method is defined on the controller, an empty controller has no reason to be.
 */
export const getMethodsMetadataFromController = (controller: Function): MethodsMetadata => {
  const methodsMetadataMap: Map<string, MethodMetadata> = Reflect.getMetadata(METADATA_KEYS.method, controller);
  if (methodsMetadataMap) {
    return methodsMetadataMap;
  }
  throw new Error(`no methods defined on controller ${controller.name}`);
};

export const getMethodParamsMetadata = (method: any): ParamsMetadata => {
  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method);

  return metadata;
};

/**
 * return the contructor name of an object instance.
 * @param o object instance to get constructor name from .
 */
export const getObjectName = (o: any): string => {
  return o.constructor.name;
};

/**
 * get the controller metadata by name.
 * @param name name of the controller
 * @throw throw if no controller is found.
 */
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
