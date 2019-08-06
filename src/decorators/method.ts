import { METADATA_KEYS } from '../constants';
import { HttpMethods, MethodMetadata, Middleware } from '../types';

/**
 * define metadata for the decorated method on the controller constructor function.
 * @param httpMethod http method ex: GET, POST, ... etc.
 * @param path route of this method under the controller route
 * @param middlewares middlewares that are run ahead of this method.
 */
// tslint:disable-next-line: no-shadowed-variable
export const httpMethod = (httpMethod: HttpMethods, path: string, ...middlewares: Middleware[]): MethodDecorator => {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const newMetadata: MethodMetadata = {
      name: String(propertyKey),
      path,
      httpMethod,
      middlewares,
    };

    const currentMethods: Map<string, MethodMetadata> =
      Reflect.getMetadata(METADATA_KEYS.method, target.constructor) || new Map<string, MethodMetadata>();

    currentMethods.set(newMetadata.name, newMetadata);

    Reflect.defineMetadata(METADATA_KEYS.method, currentMethods, target.constructor);
  };
};

export const httpGet = (path: string, ...middlewares: Middleware[]): MethodDecorator =>
  httpMethod('GET', path, ...middlewares);

export const httpPost = (path: string, ...middlewares: Middleware[]): MethodDecorator =>
  httpMethod('POST', path, ...middlewares);

export const httpPut = (path: string, ...middlewares: Middleware[]): MethodDecorator =>
  httpMethod('PUT', path, ...middlewares);

export const httpDelete = (path: string, ...middlewares: Middleware[]): MethodDecorator =>
  httpMethod('DELETE', path, ...middlewares);

export const httpPatch = (path: string, ...middlewares: Middleware[]): MethodDecorator =>
  httpMethod('PATCH', path, ...middlewares);

export const httpHead = (path: string, ...middlewares: Middleware[]): MethodDecorator =>
  httpMethod('HEAD', path, ...middlewares);

export const httpAll = (path: string, ...middlewares: Middleware[]): MethodDecorator =>
  httpMethod('ALL', path, ...middlewares);
