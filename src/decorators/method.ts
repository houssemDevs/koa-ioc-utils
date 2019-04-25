import { METADATA_KEYS } from '@/constants';
import { KnownHttpMethods, KoaMiddleware, MethodMetadata } from '@/types';

export const httpMethod = (
  method: KnownHttpMethods | string,
  path: string,
  ...middlewares: KoaMiddleware[]
): MethodDecorator => {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const newMetadata: MethodMetadata = {
      name: String(propertyKey),
      path,
      method,
      middlewares,
    };

    const currentMethods: Map<string, MethodMetadata> =
      Reflect.getMetadata(METADATA_KEYS.method, target.constructor) || new Map<string, MethodMetadata>();

    currentMethods.set(String(propertyKey), newMetadata);

    Reflect.defineMetadata(METADATA_KEYS.method, currentMethods, target.constructor);
  };
};

export const httpGet = (path: string, ...middlewares: KoaMiddleware[]): MethodDecorator =>
  httpMethod('GET', path, ...middlewares);

export const httpPost = (path: string, ...middlewares: KoaMiddleware[]): MethodDecorator =>
  httpMethod('POST', path, ...middlewares);

export const httpPut = (path: string, ...middlewares: KoaMiddleware[]): MethodDecorator =>
  httpMethod('PUT', path, ...middlewares);

export const httpDelete = (path: string, ...middlewares: KoaMiddleware[]): MethodDecorator =>
  httpMethod('DELETE', path, ...middlewares);

export const httpPatch = (path: string, ...middlewares: KoaMiddleware[]): MethodDecorator =>
  httpMethod('PATCH', path, ...middlewares);
