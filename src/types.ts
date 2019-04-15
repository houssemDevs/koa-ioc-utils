export interface KoaMiddleware {}

/* #region  Metadata types */
export interface ControllerMetadata {
  name: string;
  middlewares: KoaMiddleware[];
  controller: Function;
  path: string;
}
/* #endregion */
