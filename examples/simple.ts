import 'reflect-metadata';

import { Container, decorate, injectable } from 'inversify';
import { ParameterizedContext } from 'koa';
import supertest = require('supertest');
import { BaseMiddleware, controller, httpGet, KoaInversifyApplication } from '../lib';

decorate(injectable(), BaseMiddleware);

class MyMiddleware extends BaseMiddleware {
  constructor() {
    super();
  }
  public async handle(ctx: ParameterizedContext<any, {}>, next: () => Promise<any>): Promise<any> {
    ctx.state.s = 's';
    console.log('middleware');
    await next();
  }
}
decorate(injectable(), MyMiddleware);

const id = Symbol(MyMiddleware.name);

class UserController {
  public getUser(ctx: ParameterizedContext) {
    console.log(ctx.state.s);
    if (ctx.state.s === 's') {
      ctx.status = 200;
      ctx.body = { name: 'houssem', age: 29 };
    }
    ctx.status = 400;
  }
}
decorate(controller('/users', id), UserController);
decorate(httpGet('/'), UserController.prototype, 'getUser');

const container = new Container({ skipBaseClassChecks: true });

container.bind<BaseMiddleware>(id).to(MyMiddleware);

new KoaInversifyApplication(container).run(3000);
