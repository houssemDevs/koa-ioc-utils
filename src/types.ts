export type KoaMiddleware = (ctx: any, next: () => Promise<any>) => any;

export type HttpMethods = 'GET' | 'POST' | 'PUT' | 'UPDATE' | 'DELETE';

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
  method: HttpMethods;
  middlewares: KoaMiddleware[];
}

/* #endregion */
