import { METADATA_KEYS } from '@/constants';
import { ParamsMetadata } from '@/types';

export const ctx: ParameterDecorator = (target: Object, propertyKey: string | symbol, pararmterIndex: number) => {
  const method = target.constructor.prototype[String(propertyKey)];

  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method) || {};

  metadata.context = pararmterIndex;

  Reflect.defineMetadata(METADATA_KEYS.params, metadata, method);
};

export const resp: ParameterDecorator = (target: Object, propertyKey: string | symbol, pararmterIndex: number) => {
  const method = target.constructor.prototype[String(propertyKey)];

  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method) || {};

  metadata.resp = pararmterIndex;

  Reflect.defineMetadata(METADATA_KEYS.params, metadata, method);
};

export const req: ParameterDecorator = (target: Object, propertyKey: string | symbol, pararmterIndex: number) => {
  const method = target.constructor.prototype[String(propertyKey)];

  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method) || {};

  metadata.req = pararmterIndex;

  Reflect.defineMetadata(METADATA_KEYS.params, metadata, method);
};

export const next: ParameterDecorator = (target: Object, propertyKey: string | symbol, pararmterIndex: number) => {
  const method = target.constructor.prototype[String(propertyKey)];

  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method) || {};

  metadata.next = pararmterIndex;

  Reflect.defineMetadata(METADATA_KEYS.params, metadata, method);
};

export const p = (name: string): ParameterDecorator => (
  target: Object,
  propertyKey: string | symbol,
  pararmterIndex: number
) => {
  const method = target.constructor.prototype[String(propertyKey)];

  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method) || {};

  const params = metadata.params || [];

  params.push({ name, index: pararmterIndex });

  metadata.params = params;

  Reflect.defineMetadata(METADATA_KEYS.params, metadata, method);
};

export const q = (name: string): ParameterDecorator => (
  target: Object,
  propertyKey: string | symbol,
  pararmterIndex: number
) => {
  const method = target.constructor.prototype[String(propertyKey)];

  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method) || {};

  const queries = metadata.queries || [];

  queries.push({ name, index: pararmterIndex });

  metadata.queries = queries;

  Reflect.defineMetadata(METADATA_KEYS.params, metadata, method);
};

export const ck = (name: string): ParameterDecorator => (
  target: Object,
  propertyKey: string | symbol,
  pararmterIndex: number
) => {
  const method = target.constructor.prototype[String(propertyKey)];

  const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, method) || {};

  const cookies = metadata.cookies || [];

  cookies.push({ name, index: pararmterIndex });

  metadata.cookies = cookies;

  Reflect.defineMetadata(METADATA_KEYS.params, metadata, method);
};
