import { Container, decorate, inject, injectable } from 'inversify';
import koa, { ParameterizedContext } from 'koa';
import 'reflect-metadata';
import request from 'supertest';

import { controller, httpGet, KoaInversifyServer } from '../src';
import { METADATA_KEYS } from '../src/constants';

describe('KoaInversifyServer', () => {
  interface IUsersService {
    getUsers(): string[];
  }

  @injectable()
  class UserService implements IUsersService {
    public getUsers(): string[] {
      return ['houssem', 'narimene'];
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  @controller('/user')
  class UserController {
    private name: string = 'GHIAT Houssem';
    constructor(@inject(UserService) private userService: IUsersService) {}
    @httpGet('/name')
    public getName(ctx: ParameterizedContext) {
      ctx.status = 200;
      ctx.body = { name: this.name };
    }
    @httpGet('/error')
    public throwError() {
      throw new Error('Error test');
    }
    @httpGet('/users')
    public users(ctx: any) {
      ctx.status = 200;
      ctx.body = this.userService.getUsers();
    }
  }

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
  @controller('/mid', firstMiddleware, secondMiddleware)
  class MidController {
    @httpGet('/', routeMiddleware)
    public test(ctx: any) {
      expect(ctx.state.id).toEqual(123);
      expect(ctx.state.id2).toEqual(456);
      expect(ctx.state.id3).toEqual(789);
      ctx.status = 200;
      ctx.body = '200';
    }
  }

  const container = new Container();
  container.bind<IUsersService>(UserService).toSelf();

  const app = new KoaInversifyServer(container).build();

  it('should respond correctly', async () => {
    const resp = await request.agent(app.callback()).get('/user/name');
    expect(resp.body).toEqual({ name: 'GHIAT Houssem' });
    expect(resp.status).toEqual(200);
  });

  it('should handle errors correctly', async () => {
    const resp = await request.agent(app.callback()).get('/user/error');
    expect(resp.status).toEqual(500);
    expect(resp.text).toMatch(/gone\swrong/);
  });

  it('should access container services correctly', async () => {
    const resp = await request.agent(app.callback()).get('/user/users');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual(['houssem', 'narimene']);
  });

  it('should permit controller level middlewares correctly', async () => {
    const resp = await request.agent(app.callback()).get('/mid');
    expect(resp.status).toEqual(200);
    expect(resp.text).toMatch('200');
  });
});
