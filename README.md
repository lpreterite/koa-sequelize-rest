# koa-sequelize-rest
Quickly add koa restful api

# Installation
```
npm install koa-sequelize-restful --save
```

# Example
```
const Koa = require('koa');
const app = new Koa();

const restful = require('koa-sequelize-rest');
const router = restful(new Router({prefix: '/users'}), { model: user });

app.use(router.routes());
app.use(router.allowedMethods());

```

# Document
## restful(router, options, hooks)

### options
```
{
    model:  user //<sequelize.Model>
    paginate: {
        default: 0,
        max: 20
    },
    idField: 'id'
}
```

### hooks
```
{
    before: {
        all:    [], //add in before with all hooks
        find:   [],
        get:    [],
        create: [],
        update: [],
        patch:  [],
        remove: []
    },
    after: {
        all:    [], //add in after with all hooks
        find:   [],
        get:    [],
        create: [],
        update: [],
        patch:  [],
        remove: []
    }
}
```

#### hooks life cycle
```
{
    before: {
        all:    [call_1], //add in before with all hooks
        find:   [call_11],
        get:    [call_12],
        create: [call_13],
        update: [call_14],
        patch:  [call_15],
        remove: [call_16]
    },
    after: {
        all:    [call_2], //add in after with all hooks
        find:   [call_21],
        get:    [call_22],
        create: [call_23],
        update: [call_24],
        patch:  [call_25],
        remove: [call_26]
    }
}
```

**The order of execution**

- find
    - call_1
    - call_11
    - find 
    - call_21
    - call_2

# License

Copyright (c) 2017

Licensed under the [MIT license](LICENSE).