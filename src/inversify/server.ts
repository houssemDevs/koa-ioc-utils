import { Container, decorate, injectable } from 'inversify';
import Koa, { ParameterizedContext } from 'koa';
import koacompose from 'koa-compose';
import KoaRouter from 'koa-router';

import { TYPES } from '@/inversify/constants';
import {
  getControllerMetadataByName,
  getControllerNameFromInstance,
  getControllersFromMetadata,
  getMethodsMetadataFromController,
} from '@/utils';
import { getControllersFromContainer } from './utils';

export class KoaInversifyServer<KoaState> {
  private errorHandler: (err: Error, ctx: ParameterizedContext<KoaState>) => void;
  constructor(
    private _container: Container,
    private _app: Koa = new Koa<KoaState>(),
    private _router = new KoaRouter<KoaState>(),
  ) {
    this.errorHandler = (err: Error, ctx: ParameterizedContext<KoaState>) => {
      ctx.status = 500;
      ctx.body = 'Something gone wrong, we are working on it';
      console.log(`[ERROR]: ${err.name} - ${err.message}`);
    };
  }
  public configRouter(prefix: string) {
    this._router = new KoaRouter({ prefix });
    return this;
  }
  public configErrorHandler(errorHandler: (err: Error, ctx: ParameterizedContext<KoaState>) => void) {
    this.errorHandler = errorHandler;
  }
  public build(): Koa {
    // Setup error middleware
    this._app.use(async (ctx: ParameterizedContext<KoaState>, next: () => Promise<any>) => {
      try {
        await next();
      } catch (err) {
        this.errorHandler(err, ctx);
      }
    });

    // registering controllers
    this.registerControllers();

    // mounting routes to router.
    this.mountRoutes();

    this._app.use(this._router.routes());
    this._app.use(this._router.allowedMethods());

    return this._app;
  }
  private registerControllers() {
    const controllersMetadata = getControllersFromMetadata();
    controllersMetadata.forEach((c) => {
      decorate(injectable(), c.controller);
      this._container
        .bind(TYPES.controller)
        .to(c.controller as any)
        .whenTargetNamed(c.name);
    });
  }
  private mountRoutes() {
    const controllers = getControllersFromContainer(this._container);
    controllers.forEach((c) => {
      const controllerMetadata = getControllerMetadataByName(getControllerNameFromInstance(c));
      const methodsMetadata = getMethodsMetadataFromController(controllerMetadata.controller);
      methodsMetadata.forEach((m) => {
        c[m.name] = c[m.name].bind(c);
        switch (m.method) {
          case 'GET':
            this._router.get(
              `${controllerMetadata.path}${m.path}`,
              koacompose([...controllerMetadata.middlewares, ...m.middlewares]),
              c[m.name],
            );
            break;
          case 'POST':
            this._router.post(
              `${controllerMetadata.path}${m.path}`,
              koacompose([...controllerMetadata.middlewares, ...m.middlewares]),
              c[m.name],
            );
            break;
          case 'DELETE':
            this._router.delete(
              `${controllerMetadata.path}${m.path}`,
              koacompose([...controllerMetadata.middlewares, ...m.middlewares]),
              c[m.name],
            );
            break;
          case 'PUT':
            this._router.put(
              `${controllerMetadata.path}${m.path}`,
              koacompose([...controllerMetadata.middlewares, ...m.middlewares]),
              c[m.name],
            );
            break;
          case 'PATCH':
            this._router.patch(
              `${controllerMetadata.path}${m.path}`,
              koacompose([...controllerMetadata.middlewares, ...m.middlewares]),
              c[m.name],
            );
            break;
        }
      });
    });
  }
}
