'use strict';

const co = require('co');
const filter = require('./commons.js').filter;
const getWhere = require('./commons.js').getWhere;
const getOrder = require('./commons.js').getOrder;

function _find(model, params, getFilter){
    getFilter = getFilter || filter;
    const filterRes = getFilter(params.query || {});
    const filters = filterRes.filters;
    const query = filterRes.query;
    const where = getWhere(query);
    const order = getOrder(filters.$sort);

    let q = Object.assign({
        where,
        order,
        limit: filters.$limit,
        offset: filters.$skip
    }, params.sequelize);

    if (filters.$select) {
      q.attributes = filters.$select;
    }

    return model.findAndCount(q).then(result => {
        return Promise.resolve({
            total: result.count,
            limit: filters.$limit,
            skip: filters.$skip || 0,
            data: result.rows
        });
    });
}

function _getEntity(model, params, idField, options){
    return model.findOne({ where: { [idField]: params[idField] }, options});
}

class Restful{
    constructor(options){
        if(typeof options.model === 'undefined'){
            throw new Error('options must be model in utils.service!');
        }
        this.model = options.model;
        this.paginate = options.paginate || {};
        this.idField = options.idField || 'id';
    }
    find(){
        let rest = this;

        return co.wrap(function *(ctx, next){
            const params = ctx.params;
            const paginate = (params && typeof params.paginate !== 'undefined') ? params.paginate : rest.paginate;

            ctx.body = yield _find(rest.model, params, where => filter(where, paginate));

            ctx.status = 200;
            yield next();
        });
    }
    get(){
        let rest = this;

        return co.wrap(function *(ctx, next){
            const params = ctx.params;
            const options = Object.assign({}, params.sequelize);
            let result = yield _getEntity(rest.model, params, rest.idField, options);
            ctx.body = result || {};
            ctx.status = 200;
            yield next();
        });
    }
    create(){
        let rest = this;

        return co.wrap(function *(ctx, next){
            const options = ctx.params.sequelize || {};
            const data = ctx.request.body;

            if (Array.isArray(data)) {
                const result = yield rest.model.bulkCreate(data, options);
                ctx.body = result.map(item => item.toJSON());
            }else{
                const result = yield rest.model.create(data, options);
                ctx.body = result.toJSON();
            }
            ctx.status = 201;

            yield next();
        });
    }
    update(){
        let rest = this;

        return co.wrap(function *(ctx, next){
            const params = ctx.params;
            const options = Object.assign({}, params.sequelize);
            let instance = yield _getEntity(rest.model, params, rest.idField, options);
            instance = yield instance.update(ctx.request.body, options);

            ctx.status = 200;
            ctx.body = instance.toJSON();

            yield next();
        });
    }
    patch(){
        let rest = this;

        return co.wrap(function *(ctx, next){
            const params = ctx.params;
            const options = Object.assign({}, params.sequelize);

            ctx.body = yield rest.model.update(ctx.request.body, options);
            ctx.status = 200;
            yield next();
        });
    }
    remove(){
        let rest = this;

        return co.wrap(function *(ctx, next){
            const params = ctx.params;
            const options = Object.assign({}, params.sequelize);
            let instance = yield _getEntity(rest.model, params, rest.idField, options);
            ctx.body = instance.toJSON();

            yield instance.destroy();
            ctx.status = 200;

            yield next();
        });
    }
}

module.exports = Restful;