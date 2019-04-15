import 'reflect-metadata';
import { METADATA_KEYS } from '../src/constants';
import { httpMethod, httpPost } from '../src/decorators/method';
import { MethodMetadata } from '../src/types';

class UserController {
  public all() {}
}

describe('method metadata', () => {
  Reflect.decorate(
    [httpMethod('GET', '/'), httpPost('/')],
    UserController.prototype,
    'all',
  );

  it('should add correct metadata', () => {
    const expectedMetadata: MethodMetadata = {
      name: 'all',
      method: 'GET',
      middlewares: [],
      path: '/',
    };

    const metadatas: Map<string, MethodMetadata> = Reflect.getMetadata(
      METADATA_KEYS.method,
      UserController,
    );

    expect(metadatas.size).toEqual(1);
    expect(metadatas.get('all')).toBeTruthy();
    expect(metadatas.get('all')).toEqual(expectedMetadata);
  });
});
