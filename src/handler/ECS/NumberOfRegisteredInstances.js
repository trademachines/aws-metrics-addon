"use strict";

const _ = require('lodash');

module.exports = () => {};

module.exports.extract = (ev) => {
    let clusterName = _.get(ev, 'requestParameters.cluster');

    if (/^arn:/.test(clusterName)) {
        clusterName = clusterName.substr(clusterName.lastIndexOf('/') + 1);
    }

    return {
        cluster: clusterName
    };
};
