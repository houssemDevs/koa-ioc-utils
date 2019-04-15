export function httpMethod(
  path: string,
  ...midllewares: KoaMiddleware[]
): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {};
}
