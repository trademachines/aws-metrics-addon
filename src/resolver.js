"use strict";

const _   = require('lodash');
const fs  = require('fs');
const dir = __dirname;

const asArray           = x => _.isString(x) ? [ x ] : _.flattenDeep(x);
const asMetric          = (map, x) => {
    if (x[ 0 ] === '@') {
        x =
            _.chain(x)
                .thru(y => y.substr(1))
                .thru(y => _.get(map, `aliases['${y}']`, []))
                .thru(asArray)
                .map(y => asMetric(map, y))
                .flattenDeep()
                .value();
    }

    return x;
};
const asHandlerFilename = x => `${dir}/handler/${x}.js`;
const asExistingFiles   = x => {
    try {
        return !!fs.statSync(x);
    } catch (e) {
        return false;
    }
};

const getMetrics   = (map, source, name) => {
    const partialAsMetric = _.partial(asMetric, map);

    return _.chain(map)
        .get(`sources['${source}'].${name}`)
        .thru(asArray)
        .map(partialAsMetric)
        .flattenDeep()
        .value();
};
const getFunctions = (metrics) => {
    return _.chain(metrics)
        .flattenDeep()
        .map(asHandlerFilename)
        .filter(asExistingFiles)
        .map(f => require(f))
        .value()
};

module.exports = (map, source, name) => {
    return getFunctions(getMetrics(map, source, name));
};

module.exports.metrics = getMetrics;

module.exports.fns = getFunctions;
