import { ParameterizedContext } from 'koa';
import { URL } from 'url';

export abstract class BaseController<TState = any, TCustom = {}> {
  protected ok<T>(ctx: ParameterizedContext<TState, TCustom>, data: T) {
    let d: T | null = data;
    ctx.status = 200;
    if (!d) {
      d = null;
    } else if (typeof d === 'object') {
      ctx.type = 'application/json';
    } else {
      ctx.type = 'text/plain';
    }
    ctx.body = d;
  }
  protected notFound(ctx: ParameterizedContext<TState, TCustom>) {
    ctx.status = 404;
    ctx.body = null;
  }
  protected redirect(ctx: ParameterizedContext<TState, TCustom>, location: string | URL) {
    ctx.redirect(location.toString());
  }
  protected accepted(ctx: ParameterizedContext<TState, TCustom>) {
    ctx.status = 202;
  }
  protected created(ctx: ParameterizedContext<TState, TCustom>, location?: string | URL) {
    ctx.status = 201;
    if (location) {
      ctx.type = 'application/json';
      ctx.body = { link: location.toString() };
    } else {
      ctx.body = null;
    }
  }
  protected unauthorized<T>(ctx: ParameterizedContext<TState, TCustom>, data: T) {
    ctx.status = 401;
    let d: T | null = data;
    if (!d) {
      d = null;
    } else if (typeof d === 'object') {
      ctx.type = 'application/json';
    } else {
      ctx.type = 'text/plain';
    }
    ctx.body = d;
  }
}
