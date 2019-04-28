import supertest from 'supertest';

import { BaseController } from '../src/base_controller';
import Application, { ParameterizedContext } from 'koa';
import Router from 'koa-router';

describe('BaseController', () => {
  class SimpleController extends BaseController {
    public createUser(ctx: ParameterizedContext) {
      this.created(ctx, '/users/123');
    }
    public acceptCommand(ctx: ParameterizedContext) {
      this.accepted(ctx);
    }
    public getUser(ctx: ParameterizedContext) {
      this.ok(ctx, { user: 'houssem' });
    }
    public getHoussem(ctx: ParameterizedContext) {
      this.notFound(ctx);
    }
    public getNarimene(ctx: ParameterizedContext) {
      this.redirect(ctx, '/users/4567');
    }
  }

  const controller = new SimpleController();

  const app = new Application();
  const router = new Router();

  router.post('/users/new', controller.createUser.bind(controller));
  router.post('/users/123', controller.acceptCommand.bind(controller));
  router.get('/users', controller.getUser.bind(controller));
  router.get('users/houssem', controller.getHoussem.bind(controller));
  router.get('/users/narimene', controller.getNarimene.bind(controller));

  app.use(router.routes());
  app.use(router.allowedMethods());

  it('should make created response', async () => {
    const resp = await supertest.agent(app.callback()).post('/users/new');

    expect(resp.status).toEqual(201);
    expect(resp.body).toEqual({ link: '/users/123' });
  });

  it('should make accepted response', async () => {
    const resp = await supertest.agent(app.callback()).post('/users/123');

    expect(resp.status).toEqual(202);
    expect(resp.body).toEqual({});
  });

  it('should make ok response', async () => {
    const resp = await supertest.agent(app.callback()).get('/users');

    expect(resp.status).toEqual(200);
    expect(resp.type).toMatch('application/json');
    expect(resp.body).toEqual({ user: 'houssem' });
  });

  it('should make not found response', async () => {
    const resp = await supertest.agent(app.callback()).get('/users/houssem');

    expect(resp.status).toEqual(404);
    expect(resp.body).toEqual({});
  });

  it('should make redirect response', async () => {
    const resp = await supertest.agent(app.callback()).get('/users/narimene');

    expect(resp.status).toEqual(302);
    expect(resp.header.location).toEqual('/users/4567');
  });
});
