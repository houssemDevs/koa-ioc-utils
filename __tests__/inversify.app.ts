import 'reflect-metadata';

import supertest from 'supertest';
import { ParameterizedContext } from 'koa';

import { KoaInversifyApplication, controller, httpDelete, httpGet, httpHead, httpPatch, httpPost, httpPut, BaseMiddleware } from '../src';
import { METADATA_KEYS } from '../src/constants';
import { Container, injectable } from 'inversify';

describe('KoaInversifyApplication', () => {
  afterEach(() => {
    Reflect.deleteMetadata(METADATA_KEYS.controller, Reflect);
  });

  it('should build a basic koa app', async () => {
    class BasicController {
      public greet(ctx: any) {
        ctx.status = 200;
        ctx.body = 'hello';
      }
    }

    Reflect.decorate([controller('/')], BasicController);
    Reflect.decorate([httpGet('/')], BasicController.prototype, 'greet');

    const app = new KoaInversifyApplication()
      .configLogger(async (ctx, next) => await next())
      .build()
      .callback();

    const resp = await supertest.agent(app).get('/');

    expect(resp.status).toEqual(200);
    expect(resp.text).toMatch('hello');
  });

  it('should handle known http methods', async () => {
    class Controller {
      public mget(ctx: any) {
        ctx.status = 200;
        ctx.body = 'get';
      }
      public mpost(ctx: any) {
        ctx.status = 200;
        ctx.body = 'post';
      }
      public mhead(ctx: any) {
        ctx.status = 200;
        ctx.set({ head: 'head' });
        ctx.body = 'head';
      }
      public mput(ctx: any) {
        ctx.status = 201;
      }
      public mdelete(ctx: any) {
        ctx.status = 200;
        ctx.body = 'delete';
      }
      public mpatch(ctx: any) {
        ctx.status = 200;
        ctx.body = 'patch';
      }
    }

    Reflect.decorate([controller('/')], Controller);
    Reflect.decorate([httpGet('/get')], Controller.prototype, 'mget');
    Reflect.decorate([httpPost('/post')], Controller.prototype, 'mpost');
    Reflect.decorate([httpHead('/head')], Controller.prototype, 'mhead');
    Reflect.decorate([httpPut('/put')], Controller.prototype, 'mput');
    Reflect.decorate([httpDelete('/delete')], Controller.prototype, 'mdelete');
    Reflect.decorate([httpPatch('/patch')], Controller.prototype, 'mpatch');

    const app = new KoaInversifyApplication()
      .configLogger(async (_, next) => await next())
      .build()
      .callback();

    let resp = await supertest.agent(app).get('/get');
    expect(resp.status).toEqual(200);
    expect(resp.text).toEqual('get');

    resp = await supertest.agent(app).post('/post');
    expect(resp.status).toEqual(200);
    expect(resp.text).toEqual('post');

    resp = await supertest.agent(app).head('/head');
    expect(resp.status).toEqual(200);
    expect(resp.header.head).toEqual('head');
    expect(resp.text).toBeUndefined();

    resp = await supertest.agent(app).put('/put');
    expect(resp.status).toEqual(201);

    resp = await supertest.agent(app).delete('/delete');
    expect(resp.status).toEqual(200);
    expect(resp.text).toEqual('delete');

    resp = await supertest.agent(app).patch('/patch');
    expect(resp.status).toEqual(200);
    expect(resp.text).toEqual('patch');
  });

  it('should chain classic middlewares', async () => {
    class Controller {
      public hello(ctx: any) {
        const { app, controller, method } = ctx.state;

        ctx.status = 200;
        ctx.body = `${app}-${controller}-${method}`;
      }
    }

    const appMiddleware = async (ctx, next) => {
      ctx.state.app = 'a';
      await next();
    };

    const controllerMiddleware = async (ctx, next) => {
      ctx.state.controller = 'c';
      await next();
    };

    const methodMiddleware = async (ctx, next) => {
      ctx.state.method = 'm';
      await next();
    };

    Reflect.decorate([controller('/', controllerMiddleware)], Controller);
    Reflect.decorate([httpGet('/hello', methodMiddleware)], Controller.prototype, 'hello');

    const app = new KoaInversifyApplication()
      .configApp(app => app.use(appMiddleware))
      .configLogger(async (_, n) => await n())
      .build()
      .callback();

    const resp = await supertest.agent(app).get('/hello');

    expect(resp.status).toEqual(200);
    expect(resp.text).toMatch('a-c-m');
  });

  it('should handle BaseMiddleware middlewares', async () => {
    class Controller {
      public hello(ctx: any) {
        const { m } = ctx.state;

        ctx.status = 200;
        ctx.body = `${m}`;
      }
    }

    class Middleware extends BaseMiddleware {
      public async handle(ctx: ParameterizedContext<any, {}>, next: () => Promise<any>): Promise<any> {
        ctx.state.m = 'mid';

        await next();
      }
    }

    // need to decorate them with inversify injectable
    Reflect.decorate([injectable()], BaseMiddleware);
    Reflect.decorate([injectable()], Middleware);

    Reflect.decorate([controller('/')], Controller);
    Reflect.decorate([httpGet('/hello', Middleware.name)], Controller.prototype, 'hello');

    const container = new Container();

    container.bind<BaseMiddleware>(Middleware.name).to(Middleware);

    const app = new KoaInversifyApplication(container)
      .configLogger(async (_, n) => await n())
      .build()
      .callback();

    const resp = await supertest.agent(app).get('/hello');

    expect(resp.status).toEqual(200);
    expect(resp.text).toMatch('mid');
  });
});
