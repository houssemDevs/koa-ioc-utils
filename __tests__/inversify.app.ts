import { Container, decorate, inject, injectable } from 'inversify';
import Application, { ParameterizedContext } from 'koa';
import 'reflect-metadata';
import supertest from 'supertest';

import { controller, httpGet, KoaInversifyApplication, BaseMiddleware } from '../src';
import { METADATA_KEYS } from '../src/constants';

describe('KoaInversifyServer', () => {
  interface IUsersService {
    getUsers(): string[];
  }

  class UserService implements IUsersService {
    public getUsers(): string[] {
      return ['houssem', 'narimene'];
    }
  }
  decorate(injectable(), UserService);

  // tslint:disable-next-line: max-classes-per-file
  class UserController {
    private name: string = 'GHIAT Houssem';
    constructor(private userService: IUsersService) {}
    public getName(ctx: ParameterizedContext) {
      ctx.status = 200;
      ctx.body = { name: this.name };
    }
    public throwError() {
      throw new Error('Error test');
    }
    public users(ctx: any) {
      ctx.status = 200;
      ctx.body = this.userService.getUsers();
    }
  }
  decorate(controller('/user'), UserController);
  decorate(inject(UserService), UserController, 0);
  decorate(httpGet('/name'), UserController.prototype, 'getName');
  decorate(httpGet('/error'), UserController.prototype, 'throwError');
  decorate(httpGet('/users'), UserController.prototype, 'users');

  const firstMiddleware = async (ctx: any, next: any) => {
    ctx.state.id = 123;
    await next();
  };

  const secondMiddleware = async (ctx: any, next: any) => {
    expect(ctx.state.id).toEqual(123);
    ctx.state.id2 = 456;
    await next();
  };

  const routeMiddleware = async (ctx: any, next: any) => {
    expect(ctx.state.id2).toEqual(456);
    ctx.state.id3 = 789;
    await next();
  };

  // tslint:disable-next-line: max-classes-per-file
  class MidController {
    public test(ctx: any) {
      expect(ctx.state.id).toEqual(123);
      expect(ctx.state.id2).toEqual(456);
      expect(ctx.state.id3).toEqual(789);
      ctx.status = 200;
      ctx.body = '200';
    }
  }
  decorate(controller('/mid', firstMiddleware, secondMiddleware), MidController);
  decorate(httpGet('/', routeMiddleware), MidController.prototype, 'test');

  class Middlew extends BaseMiddleware {
    public handle(ctx: Application.ParameterizedContext<any, {}>, next: () => Promise<any>) {
      ctx.state.s = true;
    }
  }
  decorate(injectable(), Middlew);

  const symbolId = Symbol('Middlew');

  class Controller {
    public t(ctx: ParameterizedContext) {
      if (ctx.state.s) {
        ctx.status = 200;
      } else {
        ctx.status = 500;
      }
    }
  }
  decorate(controller('/middl', symbolId), Controller);
  decorate(httpGet('/'), Controller.prototype, 't');

  const container = new Container();
  container.bind<IUsersService>(UserService).toSelf();
  container.bind<BaseMiddleware>(symbolId).to(Middlew);

  const app = new KoaInversifyApplication(container).build();

  it('should respond correctly', async () => {
    const resp = await supertest.agent(app.callback()).get('/user/name');
    expect(resp.body).toEqual({ name: 'GHIAT Houssem' });
    expect(resp.status).toEqual(200);
  });

  it('should handle errors correctly', async () => {
    const resp = await supertest.agent(app.callback()).get('/user/error');
    expect(resp.status).toEqual(500);
    expect(resp.text).toMatch(/gone\swrong/);
  });

  it('should access container services correctly', async () => {
    const resp = await supertest.agent(app.callback()).get('/user/users');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual(['houssem', 'narimene']);
  });

  it('should permit controller level middlewares correctly', async () => {
    const resp = await supertest.agent(app.callback()).get('/mid');
    expect(resp.status).toEqual(200);
    expect(resp.text).toMatch('200');
  });

  it('should accept a symbol middleware', async () => {
    const resp = await supertest.agent(app.callback()).get('/middl');
    expect(resp.status).toEqual(200);
  });
});
