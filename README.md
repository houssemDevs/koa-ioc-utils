# DI utils for koa application that scales.

**koa-ioc-utils** is a set of decorators and a dependancy injection (DI) container specific Koa app implementation.

- *Decortors* are DI independent, they are used to define metadata on controllers and
their methods.

- *DI Koa app* will then use this metadata to build an app.

*NB: in its current version koa-ioc-utils provide an inversify app implementation.*

**this package is in early developpement, not ready yet for production. More documentation and examples will be provided**

Example usage:
```javascript
const { controller, httpGet, KoaInversifyServer } = require('koa-ioc-utils');

@controller('/users')
class UserController {
    @httpGet('/')
    getAllUsers(ctx) { // ctx is koa app context.
        ctx.type = 'application/json';
        ctx.body = [{name: 'Houssem'}];
    }
}

const app = new KoaInversifyServer(new Container()).build();

app.listen(3000, () => console.log('server runing on 3000 ...'));
```
## API Reference :

**a Typedoc generated documentation is available [here](https://houssemdevs.github.io/koa-ioc-utils/)**

+ `controller(path, ...middlewares)` : is a class decorator factory, it takes a path and a list of middlewares to be applied before all controller methods.

+ `http[verb](path, ...middlewares)` : is a method decorator factory, it takes a path and a list of middlewares to be applied before the method.
available verbs : httpGet, httpPost, httpPut, httpDelete, httpPatch.

+ `httpMethod(method, path, ...middlewares)`: is a method decorator factory, it takes a custom http method, a path and a list of middlewares. the known verbs method decorator are built on top of this decorator.  
`const httpGet = (path, ...middlewares) => httpMethod('GET', path, ...middlewares);`

+ `KoaInversifyServer` : is a koa app implemented using inversifyjs. given an inversify container it will resolve all the controllers dependancies and build a koa app. controllers are automatically decorated using inversifyjs `@injectable()` decorator.

