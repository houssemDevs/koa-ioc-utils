import 'reflect-metadata';

import { Middleware } from 'koa';
import { controller, httpMethod } from '../src/decorators';
import { getControllersFromMetadata, getMethodsMetadataFromController } from '../src/utils';

const middleware: Middleware = (ctx, next) => {
  ctx.status = 200;
};

class UserController {
  public getAllUsers() {}
  public createUser() {}
}

Reflect.decorate([controller('/users')], UserController);
Reflect.decorate([httpMethod('GET', '/')], UserController.prototype, 'getAllUsers');
Reflect.decorate([httpMethod('POST', '/new', middleware)], UserController.prototype, 'createUser');

class UserControllerMiddleware {}

Reflect.decorate([controller('/m', middleware)], UserControllerMiddleware);

describe('decorators', () => {
  describe('controller', () => {
    it('should define metadata correctly', () => {
      const metadata = getControllersFromMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.size).toEqual(2);

      expect(metadata.get(UserController.name).middlewares).toEqual([]);
      expect(metadata.get(UserController.name).controller).toBe(UserController);
      expect(metadata.get(UserController.name).name).toEqual(UserController.name);
      expect(metadata.get(UserController.name).path).toEqual('/users');

      expect(metadata.get(UserControllerMiddleware.name).middlewares).toEqual([middleware]);
      expect(metadata.get(UserControllerMiddleware.name).controller).toBe(UserControllerMiddleware);
      expect(metadata.get(UserControllerMiddleware.name).name).toEqual(UserControllerMiddleware.name);
      expect(metadata.get(UserControllerMiddleware.name).path).toEqual('/m');
    });
  });

  describe('httpMethod', () => {
    it('should define metadata correctly', () => {
      const metadata1 = getMethodsMetadataFromController(UserController);

      expect(metadata1).toBeDefined();
      expect(metadata1.size).toEqual(2);
      expect(metadata1.get('getAllUsers').httpMethod).toEqual('GET');
      expect(metadata1.get('getAllUsers').middlewares).toEqual([]);
      expect(metadata1.get('getAllUsers').name).toEqual('getAllUsers');
      expect(metadata1.get('getAllUsers').path).toEqual('/');
      expect(metadata1.get('createUser').httpMethod).toEqual('POST');
      expect(metadata1.get('createUser').middlewares).toEqual([middleware]);
      expect(metadata1.get('createUser').name).toEqual('createUser');
      expect(metadata1.get('createUser').path).toEqual('/new');
    });
  });
});
