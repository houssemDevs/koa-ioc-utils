import { Middleware as KoaMiddleware } from 'koa';

export type KnownHttpMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type HttpMethods = KnownHttpMethods | string;

export type ControllersMetadata = Map<string, ControllerMetadata>;

export type MethodsMetadata = Map<string, MethodMetadata>;

export type Middleware = KoaMiddleware | symbol | string;
/* #region  Metadata types */
export interface ControllerMetadata {
  name: string;
  middlewares: Middleware[];
  controller: Function;
  path: string;
}

export interface MethodMetadata {
  name: string;
  path: string;
  method: HttpMethods;
  middlewares: Middleware[];
}
/* #endregion */
