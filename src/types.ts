import { Middleware } from 'koa';

export type KnownHttpMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ControllersMetadata = Map<string, ControllerMetadata>;

export type MethodsMetadata = Map<string, MethodMetadata>;
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
  method: KnownHttpMethods | string;
  middlewares: Middleware[];
}
/* #endregion */
