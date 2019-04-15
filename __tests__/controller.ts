import 'reflect-metadata';
import { METADATA_KEYS } from '../src/constants';
import { controller } from '../src/decorators/controller';
import { ControllerMetadata } from '../src/types';

class UserController {}

describe('controller decorator', () => {
  Reflect.decorate([controller('/user'), controller('/user')], UserController);
  it('should add correct metadata', () => {
    const expectedMetadata: ControllerMetadata = {
      name: UserController.name,
      path: '/user',
      middlewares: [],
      controller: UserController,
    };

    const metadata: Map<string, ControllerMetadata> = Reflect.getMetadata(
      METADATA_KEYS.controller,
      Reflect,
    );

    expect(metadata.size).toEqual(1);
    expect(metadata.has(UserController.name)).toBeTruthy();
    expect(metadata.get(UserController.name)).toBeDefined();
    expect(metadata.get(UserController.name)).toEqual(expectedMetadata);
  });
});
