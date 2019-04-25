import { ParameterizedContext } from 'koa';

export abstract class BaseMiddleware {
  public abstract async handle(ctx: ParameterizedContext, next: () => Promise<any>): Promise<any>;
}
