import { Container, decorate, injectable } from 'inversify';
import Application, { Middleware as KoaMiddleware, ParameterizedContext } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';

import { Middleware } from '@/types';
import { isFunction, isString, isSymbol } from 'util';
import { BaseMiddleware } from '../base_middleware';
import {
  getControllerMetadataByName,
  getControllersFromMetadata,
  getMethodsMetadataFromController,
  getObjectName,
} from '../utils';
import { INVERSIFY } from './constants';
import { ConfigApp, ErrorHandler } from './types';
import { getControllersFromContainer } from './utils';

/**
 * A Koa application based on InversifyJs DI container
 * this application given an InversifyJS container, will
 * construct a Koa App with routes corresponding to the
 * decorated controllers.
 * all the controllers are instancieted from the DI container.
 */
export class KoaInversifyApplication<TState = any, TCustom = {}> {
  private errorHandler: ErrorHandler;
  private logger: KoaMiddleware;
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
    private readonly _app = new Application<TState, TCustom>(),
    private _router = new Router<TState, TCustom>()
  ) {
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
  public configLogger(logger: KoaMiddleware) {
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
  public build(): Application<TState, TCustom> {
    // Setup logger
    this.setupLoggingMiddleware();

    // Setup error handler
    this.setupErrorMiddleware();

    // Configure the koa app
    if (this.appConfigure) {
      this.appConfigure(this._app);
    }

    // Registering controllers
    this.registerControllers();

    // Mounting routes to router.
    this.buildRoutes();

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

  /**
   * register all the decorated controllers to the
   * inversify container for further instanciation.
   */
  private registerControllers() {
    const controllersMetadata = getControllersFromMetadata();
    controllersMetadata.forEach(c => {
      decorate(injectable(), c.controller);

      this._container
        .bind(INVERSIFY.CONTROLLER)
        .to(c.controller as any)
        .whenTargetNamed(c.name);
    });
  }

  /**
   * transform the Middleware[] to KoaMiddleware[] either by
   * resolving it from the container or just return it if its
   * of type function.
   * @param middlewares controller or method middlewares to resolve
   */
  private resolveMiddlewares(middlewares: Middleware[]): KoaMiddleware[] {
    return middlewares.map(middleware => {
      if (isFunction(middleware)) {
        return middleware as KoaMiddleware;
      } else {
        return this.resolveMiddlewaresFromContainer(middleware);
      }
    });
  }

  /**
   * resolve middleware from container.
   * if the middleware is of type symbol or string, try to
   * get the middleware instance from the container, bind its
   * handle method to the instance and return it.
   * if the middleware is an instance of BaseMiddleware or inherit it
   * it will just bind its handle method to instance and return it.
   * @param middleware middleware to resolve from container.
   * @throw if middleware is of unknown type, or not found in container.
   */
  private resolveMiddlewaresFromContainer(middleware: Middleware): KoaMiddleware {
    if (isSymbol(middleware) || isString(middleware)) {
      const m = this._container.get<any>(middleware);
      if (m instanceof BaseMiddleware) {
        return m.handle.bind(m);
      } else {
        throw new Error(`Middleware does not inherit from BaseMiddleware ${middleware.toString()}`);
      }
    } else if (middleware instanceof BaseMiddleware) {
      return middleware.handle.bind(middleware);
    } else {
      throw new Error(`Unknown middleware type ${typeof middleware}, ${middleware}`);
    }
  }
  /**
   * build the application router by composition
   * from each controller specific router.
   */
  private buildRoutes() {
    // resolve all controllers from container.
    const controllers = getControllersFromContainer(this._container);

    // for each container build a koa-router.
    controllers.forEach(c => {
      const controllerMetadata = getControllerMetadataByName(getObjectName(c));

      const methodsMetadata = getMethodsMetadataFromController(controllerMetadata.controller);

      const router = new Router({ prefix: controllerMetadata.path });

      // for each method of the controller bind it
      // to the controller instance to keep this reference
      // sane, and mount it to the controller koa-router
      methodsMetadata.forEach(m => {
        const boundedMethod = c[m.name].bind(c);
        // resolve the controller middleware chain
        const controllerMiddlewares = this.resolveMiddlewares(controllerMetadata.middlewares);
        // resolve the current method middleware chain
        const methodsMiddlewares = this.resolveMiddlewares(m.middlewares);
        // compose the two middleware chain to get
        // the route middleware chain.
        const routeMiddleware = compose([...controllerMiddlewares, ...methodsMiddlewares]);

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

  private customHttpMethodMiddleware(verb: string): KoaMiddleware {
    return async (ctx: ParameterizedContext, next: () => Promise<any>) => {
      if (ctx.method === verb) {
        await next();
      }
    };
  }
}
