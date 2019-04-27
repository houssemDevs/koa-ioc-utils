import { ParameterizedContext } from 'koa';
import { isObject, isString } from 'util';

export abstract class BaseController<TState = any, TCustom = {}> {
  protected ok<T>(ctx: ParameterizedContext<TState, TCustom>, data: T) {
    if (isObject(data)) {
      ctx.type = 'application/json';
    } else {
      ctx.type = 'text/plain';
    }
    ctx.status = 200;
    ctx.body = data;
  }
  protected notFound(ctx: ParameterizedContext<TState, TCustom>) {
    ctx.status = 404;
    ctx.body = null;
  }
  protected redirect(ctx: ParameterizedContext<TState, TCustom>, location: string) {
    ctx.redirect(location);
  }
  protected accpected(ctx: ParameterizedContext<TState, TCustom>) {
    ctx.status = 202;
  }
  protected created(ctx: ParameterizedContext<TState, TCustom>) {
    ctx.status = 201;
  }
}
