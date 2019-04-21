import { ParameterizedContext } from 'koa';

export interface ErrorHandler {
    (err: Error, ctx: ParameterizedContext): void;
}