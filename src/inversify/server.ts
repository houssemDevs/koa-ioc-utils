import { Container, decorate, injectable } from 'inversify';
import Application, { ParameterizedContext } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';

import { TYPES } from '@/inversify/constants';
import {
  getControllerMetadataByName,
  getControllerNameFromInstance,
  getControllersFromMetadata,
  getMethodsMetadataFromController,
} from '@/utils';
import { KoaMiddleware } from '../types';
import { ErrorHandler } from './types';
import { getControllersFromContainer } from './utils';

export class KoaInversifyServer<KoaState> {
  private errorHandler: ErrorHandler;
  private logger: KoaMiddleware;
  private middlewares: KoaMiddleware[];

  constructor(
    private readonly _container: Container,
    private readonly _app = new Application<KoaState>(),
    private _router = new Router<KoaState>()
  ) {
    this.middlewares = [];
    this.errorHandler = (err, ctx) => {
      ctx.status = 500;
      ctx.body = 'Something gone wrong, we are working on it';
      console.log(`[ERROR]: ${err.name} - ${err.message}`);
    };
    this.logger = async (ctx, next) => {
      const startedAt = Date.now();
      console.log(`<-- ${ctx.method} ${ctx.path} ${ctx.host}`);
      await next();
      const time = Date.now() - startedAt;
      console.log(`--> ${ctx.method} ${ctx.path} ${ctx.host} ${ctx.status} ${time}ms`);
    };
  }

  public configRouter(prefix: string) {
    this._router = new Router({ prefix });
    return this;
  }

  public configErrorHandler(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
    return this;
  }

  public configMiddlewares(...middlewares: KoaMiddleware[]) {
    this.middlewares = middlewares;
    return this;
  }

  public configLogger(logger: KoaMiddleware) {
    this.logger = logger;
    return this;
  }

  public build(): Application {
    // Setup logger
    this.setupLoggingMiddleware();

    //setup error handler
    this.setupErrorMiddleware();

    // Setup middlewares.
    this._app.use(compose(this.middlewares));

    // Registering controllers
    this.registerControllers();

    // Mounting routes to router.
    this.mountRoutes();

    // Setup app router.
    this._app.use(this._router.routes());
    this._app.use(this._router.allowedMethods());

    return this._app;
  }

  public run(port: number): void {
    const app = this.build();
    app.listen(port, () => console.log(`server listening on ${port} ...`));
  }

  private registerControllers() {
    const controllersMetadata = getControllersFromMetadata();
    controllersMetadata.forEach(c => {
      decorate(injectable(), c.controller);

      this._container
        .bind(TYPES.controller)
        .to(c.controller as any)
        .whenTargetNamed(c.name);
    });
  }

  private mountRoutes() {
    const controllers = getControllersFromContainer(this._container);
    controllers.forEach(c => {
      const controllerMetadata = getControllerMetadataByName(getControllerNameFromInstance(c));
      const methodsMetadata = getMethodsMetadataFromController(controllerMetadata.controller);
      const router = new Router({ prefix: controllerMetadata.path });
      methodsMetadata.forEach(m => {
        const boundedMethod = c[m.name].bind(c);
        const routeMiddleware = compose([...controllerMetadata.middlewares, ...m.middlewares]);
        switch (m.method) {
          case 'GET':
            router.get(`${m.path}`, routeMiddleware, boundedMethod);
            break;
          case 'POST':
            router.post(`${m.path}`, routeMiddleware, boundedMethod);
            break;
          case 'DELETE':
            router.delete(`${m.path}`, routeMiddleware, boundedMethod);
            break;
          case 'PUT':
            router.put(`${m.path}`, routeMiddleware, boundedMethod);
            break;
          case 'PATCH':
            router.patch(`${m.path}`, routeMiddleware, boundedMethod);
            break;
          default:
            router.use(this.customHttpMethodMiddleware(m.method), boundedMethod);
            break;
        }
      });
      this._router.use(router.routes());
      this._router.use(router.allowedMethods());
    });
  }

  private setupErrorMiddleware() {
    this._app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        this.errorHandler(err, ctx);
      }
    });
  }

  private setupLoggingMiddleware() {
    this._app.use(this.logger);
  }

  private customHttpMethodMiddleware(verb: string) {
    const methodFilter = async (ctx: ParameterizedContext, next: () => Promise<any>) => {
      if (ctx.method === verb) {
        await next();
      }
    };
    return methodFilter;
  }
}
