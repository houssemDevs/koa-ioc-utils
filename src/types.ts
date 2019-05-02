import { Middleware as KoaMiddleware } from 'koa';
import { BaseMiddleware } from './base_middleware';

export type KnownHttpMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type HttpMethods = KnownHttpMethods | string;

export type ControllersMetadata = Map<string, ControllerMetadata>;

export type MethodsMetadata = Map<string, MethodMetadata>;

export type Middleware = KoaMiddleware | symbol | BaseMiddleware | string;

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

export interface ParamsMetadata {
  context?: number;
  resp?: number;
  req?: number;
  next?: number;
  params?: Array<{ name: string; index: number }>;
  queries?: Array<{ name: string; index: number }>;
  cookies?: Array<{ name: string; index: number }>;
}
/* #endregion */
