import Application, { ParameterizedContext } from 'koa';

export type ErrorHandler = (err: Error, ctx: ParameterizedContext) => void;

export type ConfigApp = (app: Application) => void;

export type ConfigErrorHandler = (errHandler: ErrorHandler) => void;
