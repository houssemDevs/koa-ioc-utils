import { ParameterizedContext } from 'koa';

/**
 * A Middleware abstract class intended to be used
 * for middlewares that need DI capabilities when get
 * constructed.
 */
export abstract class BaseMiddleware<TState = any, TCustom = {}> {
  public abstract async handle(ctx: ParameterizedContext<TState, TCustom>, next: () => Promise<any>): Promise<any>;
}
