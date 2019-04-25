import { Container, decorate, injectable } from 'inversify';
import Application, { Middleware, ParameterizedContext } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';

import { isSymbol } from 'util';
import { BaseMiddleware } from '../base_middleware';
import {
  getControllerMetadataByName,
  getControllersFromMetadata,
  getMethodsMetadataFromController,
  getObjectName,
} from '../utils';
import { TYPES } from './constants';
import { ConfigApp, ErrorHandler } from './types';
import { getControllersFromContainer } from './utils';

/**
 * A Koa application based on InversifyJs DI container
 * this application given an InversifyJS container, will
 * construct a Koa App with routes corresponding to the
 * decorated controllers.
 * all the controllers are instancieted from the DI container.
 */
export class KoaInversifyApplication<KoaState> {
  private errorHandler: ErrorHandler;
  private logger: Middleware;
  private middlewares: Middleware[];
  private appConfigure: ConfigApp | undefined;
  /**
   * construct a new KoaInversifyApplication and setup default
   * error handler and default logger.
   * @param _container InversifyJS Container
   * @param _app koa Application
   * @param _router koa-router Router
   */
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

  /**
   * get a function that take a koa app an configure it with server level
   * middlewares.
   * @param c configurtion function
   */
  public configApp(c: ConfigApp) {
    this.appConfigure = c;
    return this;
  }

  /**
   * setup the prefix for the root router of the application.
   * @param prefix prefix for the root koa-router router.
   */
  public configRouter(prefix: string) {
    this._router = new Router({ prefix });
    return this;
  }

  /**
   * setup the error handler function for this application.
   * the error handler is a function that recive and error as first
   * argument and the koa context at its second argument.
   * errorHandler(err: Error, ctx: ParametrizedContext)
   * the error handler middleware is the second koa middleware in
   * the middleware chain of the application after the logger.
   * it will wrap all of the other middlewares in a try-catch block,
   * if anything throw an error the error and the context will be
   * passed to the error handler function. the default error handler
   * function will set reponse status to 500 and
   * the body to a typical internal error message.
   * @param errorHandler error handler funciton.
   */
  public configErrorHandler(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
    return this;
  }

  /**
   * setup the application logger middleware. this is the first
   * middleware in the middleware chain.
   * @param logger a koa middleware that will handle logging.
   */
  public configLogger(logger: Middleware) {
    this.logger = logger;
    return this;
  }

  /**
   * build and return koa application.
   * the build process run throught steps.
   * 1 setup the logger middleware.
   * 2 setup the error middleware.
   * 3 setup the rest of middlewares.
   * 4 register all the controller in the DI container.
   * 5 get controllers instances from the DI container and build the router.
   */
  public build(): Application {
    // Setup logger
    this.setupLoggingMiddleware();

    // Setup error handler
    this.setupErrorMiddleware();

    // Config app
    if (this.appConfigure) {
      this.appConfigure(this._app);
    }

    // Registering controllers
    this.registerControllers();

    // Mounting routes to router.
    this.mountRoutes();

    // Setup app router.
    this._app.use(this._router.routes());
    this._app.use(this._router.allowedMethods());

    return this._app;
  }

  /**
   * build the koa application and run it on server.
   * @param port port on which the server will listen
   */
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

  private composeMiddlewares(middlewares: any[]): Middleware[] {
    console.log(middlewares);
    return middlewares.map(middleware => {
      if (isSymbol(middleware)) {
        console.log(`symbol on ${middleware.toString()}`);
        try {
          const instance = this._container.get<BaseMiddleware>(middleware.valueOf());
          return instance.handle.bind(instance);
        } catch (err) {
          throw new Error(`No middleware bound to ${middleware.toString()} : ${err.message}`);
        }
      } else {
        return middleware;
      }
    });
  }

  private mountRoutes() {
    const controllers = getControllersFromContainer(this._container);
    controllers.forEach(c => {
      const controllerMetadata = getControllerMetadataByName(getObjectName(c));
      const methodsMetadata = getMethodsMetadataFromController(controllerMetadata.controller);
      const router = new Router({ prefix: controllerMetadata.path });
      methodsMetadata.forEach(m => {
        const boundedMethod = c[m.name].bind(c);
        const routeMiddleware = compose([
          ...this.composeMiddlewares(controllerMetadata.middlewares),
          ...this.composeMiddlewares(m.middlewares),
        ]);
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

  private customHttpMethodMiddleware(verb: string): Middleware {
    return async (ctx: ParameterizedContext, next: () => Promise<any>) => {
      if (ctx.method === verb) {
        await next();
      }
    };
  }
}
