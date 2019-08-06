import { Container, decorate, injectable } from 'inversify';
import Application, { Middleware as KoaMiddleware, ParameterizedContext } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';
import { performance } from 'perf_hooks';

import { Middleware, ParamsMetadata } from '@/types';
import { isFunction, isString, isSymbol } from 'util';
import { BaseMiddleware } from '../base_middleware';
import {
  defaultErrorMapper,
  getControllerMetadataByName,
  getControllersFromMetadata,
  getMethodParamsMetadata,
  getMethodsMetadataFromController,
  getObjectName,
  responseObjectToKoaResponse,
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
  private appTailConfigure: ConfigApp | undefined;
  /**
   * construct a new KoaInversifyApplication and setup default
   * error handler and default logger.
   * @param _container InversifyJS Container
   * @param _app koa Application
   * @param _router koa-router Router
   */
  constructor(
    private readonly _container: Container = new Container(),
    private readonly _app = new Application<TState, TCustom>(),
    private readonly _router = new Router<TState, TCustom>()
  ) {
    this.errorHandler = (err, ctx) => {
      responseObjectToKoaResponse(defaultErrorMapper(err), ctx);
      console.log(`[ERROR]: ${err.name} - ${err.message}`);
    };
    this.logger = async (ctx, next) => {
      const startedAt = performance.now();
      console.log(`<-- ${ctx.method} ${ctx.path} ${ctx.host}`);
      await next();
      console.log(`--> ${ctx.method} ${ctx.path} ${ctx.host} ${ctx.status} ${performance.now() - startedAt}ms`);
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
   * get a function that take a koa app an configure it with server level
   * middlewares.
   * the configuration function is called after mounting routes to the router.
   * @param c configurtion function
   */
  public configTailApp(c: ConfigApp) {
    this.appTailConfigure = c;
    return this;
  }

  /**
   * setup the prefix for the root router of the application.
   * @param prefix prefix for the root koa-router router.
   */
  public configRouter(prefix: string) {
    this._router.prefix(prefix);
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
   * 6 configure the built app
   */
  public build(): Application<TState, TCustom> {
    // Setup logger
    this.setupLoggingMiddleware();

    // Setup error handler
    this.setupErrorMiddleware();

    // Configure the app with server level middlewares
    if (this.appConfigure) {
      this.appConfigure(this._app);
    }

    // Registering controllers
    this.registerControllers();

    // building routes.
    this.buildRoutes();

    // Setup app router.
    this._app.use(this._router.routes());
    this._app.use(this._router.allowedMethods());

    // tail configuration
    if (this.appTailConfigure) {
      this.appTailConfigure(this._app);
    }

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
      } else if (isSymbol(middleware) || isString(middleware)) {
        // if the middleware is a symbol or string resolve it from container.
        const m = this._container.get<any>(middleware);

        // if the middleware is instance of BaseMiddleware
        // bind the handle method to the instance and return it
        // throw if it's not.
        if (m instanceof BaseMiddleware) {
          return m.handle.bind(m);
        } else {
          throw new Error(
            `Resolved middleware is not of type BaseMiddleware, make sure to inherit from BaseMiddleware ${m.constructor.name}`
          );
        }
        // its considred a bad habit to have a middleware inherit
        // from BaseMiddlware and not being resolved from the container
        // this base calss is used especially to benefit from DI
      } else if (middleware instanceof BaseMiddleware) {
        return middleware.handle.bind(middleware);
      } else {
        throw new Error(`Unknown middleware type ${typeof middleware} - ${middleware}`);
      }
    });
  }

  // /**
  //  * resolve middlewares from container if they are of
  //  * type symbol | string, or if its of type BaseMiddlware
  //  * just bind the handle method to the instance and return it
  //  * @param middleware middleware to be resolved (not a function)
  //  * @throw if the middleware is of unknown type.
  //  */
  // private resolveMiddlewareFromContainer(middleware: Middleware): KoaMiddleware {}

  private resolveMethod(controller: any, methodName: string): KoaMiddleware {
    const method: Function = controller.constructor.prototype[methodName];

    const paramsMetadata: ParamsMetadata = getMethodParamsMetadata(method);

    if (paramsMetadata) {
      const handler = async (ctx: ParameterizedContext, next: () => Promise<any>): Promise<any> => {
        const args = new Array(method.length);

        if (paramsMetadata.context !== undefined) {
          args[paramsMetadata.context] = ctx;
        }

        if (paramsMetadata.req !== undefined) {
          args[paramsMetadata.req] = ctx.request;
        }

        if (paramsMetadata.resp !== undefined) {
          args[paramsMetadata.resp] = ctx.response;
        }

        if (paramsMetadata.next !== undefined) {
          args[paramsMetadata.next] = next;
        }

        if (paramsMetadata.params !== undefined) {
          paramsMetadata.params.forEach(p => {
            if (ctx.params[p.name]) {
              args[p.index] = ctx.params[p.name];
            } else {
              args[p.index] = undefined;
            }
          });
        }

        if (paramsMetadata.queries !== undefined) {
          paramsMetadata.queries.forEach(q => {
            if (ctx.query[q.name]) {
              args[q.index] = ctx.query[q.name];
            } else {
              args[q.index] = undefined;
            }
          });
        }

        if (paramsMetadata.cookies !== undefined) {
          paramsMetadata.cookies.forEach(ck => {
            if (ctx.cookies.get(ck.name)) {
              args[ck.index] = ctx.cookies.get(ck.name);
            } else {
              args[ck.index] = undefined;
            }
          });
        }

        if (args.length < method.length) {
          throw new Error('Method with decorated params need to have all of its params decorated');
        }

        const result = await controller[methodName](...args);

        if (!ctx.body) {
          ctx.body = result;
        }

        if (paramsMetadata.next === undefined) {
          await next();
        }
      };

      return handler;
    } else {
      // TODO: check if method is conform koa middleware.
      return controller[methodName].bind(controller);
    }
  }

  /**
   * resolve controllers from the container and
   * build a koa-router for each controller then
   * attach the routers to the main app router
   */
  private buildRoutes() {
    // get all controllers from the container
    const controllers = getControllersFromContainer(this._container);

    // for each controller we will build a koa-router
    // then attach this controller specific router to
    // the application router.
    controllers.forEach(controller => {
      const controllerMetadata = getControllerMetadataByName(getObjectName(controller));

      const methodsMetadata = getMethodsMetadataFromController(controllerMetadata.controller);

      const router = new Router();

      if (controllerMetadata.path !== '/') {
        router.prefix(controllerMetadata.path);
      }

      // for each method of the controller bind it
      // to the controller instance to keep 'this' reference
      // sane, and mount it to the controller koa-router
      methodsMetadata.forEach(methodMetadata => {
        // resolve the method that will handle the request.
        const routeHandler = this.resolveMethod(controller, methodMetadata.name);

        // resolve controller and method middlewares chain
        const controllerMiddlewares = this.resolveMiddlewares(controllerMetadata.middlewares);
        const methodMiddlewares = this.resolveMiddlewares(methodMetadata.middlewares);

        // compose route middlewares chain from controller and methods middlewares.
        const routeMiddleware = compose([...controllerMiddlewares, ...methodMiddlewares]);

        // mount the route handler to the router
        switch (methodMetadata.httpMethod) {
          case 'GET':
            // console.log(`${controllerMetadata.name} : GET - MATCHED ${m.method}`);
            router.get(`${methodMetadata.path}`, routeMiddleware, routeHandler);
            break;
          case 'POST':
            // console.log(`${controllerMetadata.name} : POST - MATCHED ${m.method}`);
            router.post(`${methodMetadata.path}`, routeMiddleware, routeHandler);
            break;
          case 'DELETE':
            // console.log(`${controllerMetadata.name} : DELETE - MATCHED ${m.method}`);
            router.delete(`${methodMetadata.path}`, routeMiddleware, routeHandler);
            break;
          case 'PUT':
            // console.log(`${controllerMetadata.name} : PUT - MATCHED ${m.method}`);
            router.put(`${methodMetadata.path}`, routeMiddleware, routeHandler);
            break;
          case 'PATCH':
            // console.log(`${controllerMetadata.name} : PATCH - MATCHED ${m.method}`);
            router.patch(`${methodMetadata.path}`, routeMiddleware, routeHandler);
            break;
          case 'HEAD':
            // console.log(`${controllerMetadata.name} : HEAD - MATCHED ${m.method}`);
            router.head(`${methodMetadata.path}`, routeMiddleware, routeHandler);
            break;
          case 'ALL':
            router.all(`${methodMetadata.path}`, routeMiddleware, routeHandler);
          default:
            // console.log(`${controllerMetadata.name} : CUSTOM METHOD ${m.method}`);
            router.all(
              `${methodMetadata.path}`,
              compose([routeMiddleware, this.httpMethodFilter(methodMetadata.httpMethod)]),
              routeHandler
            );
            break;
        }
      });

      // console.log(`Controller : ${controllerMetadata.name}`);
      // console.log(router.stack);

      // attach controller router to the application router.
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

  // TODO: correct matching route bug, try all with a filter middleware.
  // TODO: test it
  private httpMethodFilter(verb: string): KoaMiddleware {
    return async (ctx: ParameterizedContext, next: () => Promise<any>) => {
      if (ctx.method === verb) {
        await next();
      } else {
        ctx.status = 405;
      }
    };
  }
}
