"use strict";
const _ = require('lodash');

const extractInfo = (ev) => {
    const region    = _.get(ev, 'awsRegion');
    const container = _.get(ev, 'requestParameters.containerName');
    let clusterName = _.get(ev, 'requestParameters.cluster');

    if (/^arn:/.test(clusterName)) {
        clusterName = clusterName.substr(clusterName.lastIndexOf('/') + 1);
    }

    return {
        cluster: clusterName,
        region: region,
        container: container
    };
};

module.exports.extractInfo = extractInfo;
