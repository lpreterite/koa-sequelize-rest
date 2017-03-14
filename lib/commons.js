'use strict';

const PROPERTIES = ['$sort', '$limit', '$skip', '$select', '$populate'];

function parse (number) {
  if (typeof number !== 'undefined') {
    return Math.abs(parseInt(number, 10));
  }
}

function getLimit (limit, paginate) {
  if (paginate && paginate.default) {
    return Math.min(limit || paginate.default, paginate.max || Number.MAX_VALUE);
  }

  return limit;
}

function convertSort (sort) {
  if (typeof sort !== 'object') {
    return sort;
  }

  const result = {};

  Object.keys(sort).forEach(key => (result[key] = typeof sort[key] === 'object' ? sort[key] : parseInt(sort[key], 10)));

  return result;
}

function omit(obj, keys){
  const result = Object.assign({}, obj);
  keys.forEach(key => delete result[key]);
  return result;
}

exports.filter = function (query, paginate) {
  let filters = {
    $sort: convertSort(query.$sort),
    $limit: getLimit(parse(query.$limit), paginate),
    $skip: parse(query.$skip),
    $select: query.$select,
    $populate: query.$populate
  };

  return { filters, query: omit(query, PROPERTIES) };
};


exports.getOrder = function(sort) {
    sort = sort || {};
    let order = [];

    Object.keys(sort).forEach(name => order.push([ name, parseInt(sort[name], 10) === 1 ? 'ASC' : 'DESC' ]));

    return order;
};

exports.getWhere = function(query) {
    let where = Object.assign({}, query);

    Object.keys(where).forEach(prop => {
        let value = where[prop];
        if (value && value.$nin) {
            value = Object.assign({}, value);

            value.$notIn = value.$nin;
            delete value.$nin;

            where[prop] = value;
        }
    });

    return where;
};