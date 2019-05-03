import 'reflect-metadata';

import { controller, httpMethod } from '../src/decorators';
import { getControllerMetadataByName, getControllersFromMetadata, getMethodsMetadataFromController, getObjectName } from '../src/utils';

class UserController {
  public getAllUsers() {}
}

Reflect.decorate([controller('/')], UserController);
Reflect.decorate([httpMethod('GET', '/')], UserController.prototype, 'getAllUsers');

describe('utils', () => {
  describe('getControllerMetadataByName', () => {
    it('should get controller metadata by name', () => {
      const metadata = getControllerMetadataByName(UserController.name);

      expect(metadata).toBeDefined();
      expect(metadata.controller).toBe(UserController);
      expect(metadata.name).toEqual(UserController.name);
      expect(metadata.middlewares).toEqual([]);
      expect(metadata.path).toEqual('/');
    });
  });

  describe('getControllersFromMetadata', () => {
    it('should get all decorated controllers metadata', () => {
      const metadata = getControllersFromMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.size).toEqual(1);
      expect(metadata.get(UserController.name)).toBeDefined();
      expect(metadata.get(UserController.name).controller).toBe(UserController);
      expect(metadata.get(UserController.name).middlewares).toEqual([]);
      expect(metadata.get(UserController.name).name).toEqual(UserController.name);
      expect(metadata.get(UserController.name).path).toEqual('/');
    });
  });

  describe('getMethodsMetadataFromController', () => {
    it('should get all decorated methods metadata from controller', () => {
      const metadata = getMethodsMetadataFromController(UserController);

      const methodName = UserController.prototype.getAllUsers.name;

      expect(metadata).toBeDefined();
      expect(metadata.size).toEqual(1);
      expect(metadata.get(methodName)).toBeDefined();
      expect(metadata.get(methodName).httpMethod).toEqual('GET');
      expect(metadata.get(methodName).middlewares).toEqual([]);
      expect(metadata.get(methodName).path).toEqual('/');
      expect(metadata.get(methodName).name).toEqual(methodName);
    });

    it('should throw when no methods are decorated on controller', () => {
      class NoMethodsController {}

      Reflect.decorate([controller('/no')], NoMethodsController);

      expect(() => getMethodsMetadataFromController(NoMethodsController)).toThrow();
    });
  });

  describe('getObjectName', () => {
    it('should return object instance constructor function name', () => {
      const name = getObjectName(new UserController());

      expect(name).toEqual(UserController.name);
    });
  });
});
