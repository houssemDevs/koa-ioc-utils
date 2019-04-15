import { controller, httpGet, KoaInversifyServer } from '@/index';
import { Container, inject, injectable } from 'inversify';
import { ParameterizedContext } from 'koa';
import 'reflect-metadata';

@injectable()
class Service {
  public show() {
    return 'real name is nega';
  }
}

// tslint:disable-next-line: max-classes-per-file
@controller('/user')
class UserController {
  private fname: string;
  private service: Service;
  constructor(@inject(Service) service: Service) {
    this.service = service;
    this.fname = 'houssem';
  }
  @httpGet('/u')
  public user(ctx: ParameterizedContext<{}>) {
    ctx.status = 200;
    ctx.body = `user is ${this.fname}`;
  }
  @httpGet('/e')
  public nega(ctx: ParameterizedContext) {
    throw new Error('houssem');
  }
  @httpGet('/s')
  public ser(ctx: ParameterizedContext) {
    ctx.status = 200;
    ctx.body = this.service.show();
  }
}

const c = new Container();

c.bind<Service>(Service).toSelf();

const srv = new KoaInversifyServer<{}>(c);

const app = srv.build();

app.listen(3000, () => console.log(`runing on 3000`));
