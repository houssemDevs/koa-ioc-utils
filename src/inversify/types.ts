import { ParameterizedContext } from 'koa';

export type ErrorHandler = (err: Error, ctx: ParameterizedContext) => void;
