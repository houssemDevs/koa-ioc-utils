import 'reflect-metadata';

import { Container, injectable } from 'inversify';

import { getControllersFromContainer } from '../src/inversify/utils';
import { INVERSIFY } from '../src/inversify/constants';
import { controller, httpGet } from '../src/decorators';

class UserController {
  public getAllUser() {}
}

Reflect.decorate([injectable()], UserController);
Reflect.decorate([controller('/')], UserController);
Reflect.decorate([httpGet('/all')], UserController.prototype, UserController.prototype.getAllUser.name);

describe('inversify.utils', () => {
  describe('getControllersFromContainer', () => {
    let container: Container;

    beforeEach(() => {
      container = new Container();
    });

    it('should get all controllers from container', () => {
      container.bind(INVERSIFY.CONTROLLER).to(UserController);

      const controllers = getControllersFromContainer(container);

      expect(controllers.length).toEqual(1);
      expect(controllers[0]).toBeInstanceOf(UserController);
    });

    it('should throw when no controller is registred', () => {
      expect(() => getControllersFromContainer(container)).toThrow();
    });
  });
});
