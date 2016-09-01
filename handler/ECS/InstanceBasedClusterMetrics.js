"use strict";
const _     = require('lodash');
const async = require('neo-async');

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

const extractMetrics = (instances, cb) => {
    let metrics             = [];
    const healthyPartitions = _.partition(instances, 'agentConnected');
    const healthy           = healthyPartitions[ 0 ].length;
    const unhealthy         = healthyPartitions[ 1 ].length;

    metrics.push({
        MetricName: 'RegisteredInstances',
        Value: instances.length,
        Unit: 'Count'
    });
    metrics.push({
        MetricName: 'HealthyRegisteredInstances',
        Value: healthy,
        Unit: 'Count'
    });
    metrics.push({
        MetricName: 'UnhealthyRegisteredInstances',
        Value: unhealthy,
        Unit: 'Count'
    });

    const metricData = {
        MetricData: metrics,
        Namespace: 'Ext/AWS/ECS'
    };

    cb(null, metricData);
};

const getContainerInstancesDescription = (ecs, eventInfo, containerInstancesData, cb) => {
    const params = {
        cluster: eventInfo.cluster,
        containerInstances: containerInstancesData
    };
    ecs.describeContainerInstances(params, (err, data) => {
        if (err) {
            return cb(err);
        }

        return cb(null, data.containerInstances);
    });
};

const getContainerInstances = (ecs, eventInfo, cb) => {
    ecs.listContainerInstances({ cluster: eventInfo.cluster }, (err, data) => {
        if (err) {
            return cb(err);
        }

        return cb(null, data.containerInstanceArns);
    });
};

module.exports = (ecs, event, cb) => {
    const info       = extractInfo(event);
    const dimensions = [ { Name: 'ClusterName', Value: info.cluster } ];

    async.waterfall([
        (cb) => {
            getContainerInstances(ecs, info, cb);
        },
        (instancesData, cb) => {
            getContainerInstancesDescription(ecs, info, instancesData, cb);
        },
        (instancesData, cb) => {
            extractMetrics(instancesData, cb);
        },
        (metrics, cb) => {
            metrics.MetricData = _.map(metrics.MetricData, (m) => {
                m.Dimensions = dimensions;
                return m;
            });

            cb(null, metrics);
        }
    ], cb);
};

module.exports.extractInfo = extractInfo;
module.exports.extractMetrics = extractMetrics;
module.exports.getContainerInstances = getContainerInstances;
module.exports.getContainerInstancesDescription = getContainerInstancesDescription;
