import 'reflect-metadata';

import { ctx, resp, req, next, q, p, ck } from '../src';
import { METADATA_KEYS } from '../src/constants';
import { ParamsMetadata } from '../src/types';

describe('decorators.params', () => {
  it('should define context metadata', () => {
    class Controller {
      public hello(@ctx ctx: any) {}
    }

    const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, Controller.prototype.hello);

    expect(metadata).toBeDefined();
    expect(metadata.context).toEqual(0);
  });

  it('should define response metadata', () => {
    class Controller {
      public hello(@resp resp: any) {}
    }

    const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, Controller.prototype.hello);

    expect(metadata).toBeDefined();
    expect(metadata.resp).toEqual(0);
  });

  it('should define request metadata', () => {
    class Controller {
      public hello(@req req: any) {}
    }

    const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, Controller.prototype.hello);

    expect(metadata).toBeDefined();
    expect(metadata.req).toEqual(0);
  });

  it('should define next metadata', () => {
    class Controller {
      public hello(@next next: any) {}
    }

    const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, Controller.prototype.hello);

    expect(metadata).toBeDefined();
    expect(metadata.next).toEqual(0);
  });

  it('should define param metadata', () => {
    class Controller {
      public hello(@p('p1') p1: any, @p('p2') p2: any) {}
    }

    const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, Controller.prototype.hello);

    const expectMetadata = [{ name: 'p2', index: 1 }, { name: 'p1', index: 0 }];

    expect(metadata).toBeDefined();
    expect(metadata.params.length).toEqual(2);
    expect(metadata.params).toEqual(expectMetadata);
  });

  it('should define query metadata', () => {
    class Controller {
      public hello(@q('q1') q1: any, @q('q2') q2: any) {}
    }

    const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, Controller.prototype.hello);

    const expectMetadata = [{ name: 'q2', index: 1 }, { name: 'q1', index: 0 }];

    expect(metadata).toBeDefined();
    expect(metadata.queries.length).toEqual(2);
    expect(metadata.queries).toEqual(expectMetadata);
  });

  it('should define cookie metadata', () => {
    class Controller {
      public hello(@ck('ck1') ck1: any, @ck('ck2') ck2: any) {}
    }

    const metadata: ParamsMetadata = Reflect.getMetadata(METADATA_KEYS.params, Controller.prototype.hello);

    const expectMetadata = [{ name: 'ck2', index: 1 }, { name: 'ck1', index: 0 }];

    expect(metadata).toBeDefined();
    expect(metadata.cookies.length).toEqual(2);
    expect(metadata.cookies).toEqual(expectMetadata);
  });
});
