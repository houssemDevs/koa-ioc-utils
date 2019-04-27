import Application, { ParameterizedContext } from 'koa';

export type ErrorHandler = <TState = any, TCustom = {}>(err: Error, ctx: ParameterizedContext<TState, TCustom>) => void;

export type ConfigApp = <TState = any, TCustom = {}>(app: Application<TState, TCustom>) => void;

export type ConfigErrorHandler = (errHandler: ErrorHandler) => void;
