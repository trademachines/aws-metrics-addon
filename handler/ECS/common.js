"use strict";
const _ = require('lodash');

const extractInfo = (ev) => {
    const region    = _.get(ev, 'awsRegion');
    let clusterName = _.get(ev, 'requestParameters.cluster');

    if (/^arn:/.test(clusterName)) {
        clusterName = clusterName.substr(clusterName.lastIndexOf('/') + 1);
    }

    return {
        cluster: clusterName,
        region: region
    };
};

module.exports.extractInfo = extractInfo;
