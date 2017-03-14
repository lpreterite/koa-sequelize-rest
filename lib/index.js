'use strict';

const compose = require('koa-convert').compose;
const Restful = require('./restful');

//生成restful路由
module.exports = function(router, opts, hooks){
    opts = opts || {};
    hooks = Object.assign({before: {}, after: {}}, hooks);

    const restful = new Restful(opts);
    let actions = {
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    };
    Object.keys(actions).forEach(function(method){
        actions[method] = [].concat(
            hooks.before.all || [],
            hooks.before[method] || [],
            restful[method](),
            hooks.after[method] || [],
            hooks.after.all || []
        );
    });

    return router
        .get('/', compose(actions.find))
        .get('/:id', compose(actions.get))
        .post('/', compose(actions.create))
        .put('/:id', compose(actions.update))
        .patch('/:id', compose(actions.patch))
        .del('/:id', compose(actions.remove));
};