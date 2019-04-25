import { ParameterizedContext } from 'koa';

export type KoaMiddleware = (ctx: ParameterizedContext, next: () => Promise<any>) => void;

export type KnownHttpMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ControllersMetadata = Map<string, ControllerMetadata>;

export type MethodsMetadata = Map<string, MethodMetadata>;
/* #region  Metadata types */
export interface ControllerMetadata {
  name: string;
  middlewares: KoaMiddleware[];
  controller: Function;
  path: string;
}

export interface MethodMetadata {
  name: string;
  path: string;
  method: KnownHttpMethods | string;
  middlewares: KoaMiddleware[];
}
/* #endregion */
