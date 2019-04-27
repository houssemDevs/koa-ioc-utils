import { ParameterizedContext } from 'koa';

export abstract class BaseMiddleware<TState = any, TCustom = {}> {
  public abstract async handle(ctx: ParameterizedContext<TState, TCustom>, next: () => Promise<any>): Promise<any>;
}
