"use strict";
const _      = require('lodash');
const async  = require('neo-async');
const common = require('./common');

const extractMetrics = (service, cb) => {
    let metrics = [];

    metrics.push({
        MetricName: 'DesiredTasks',
        Value: service.desiredCount,
        Unit: 'Count'
    });
    metrics.push({
        MetricName: 'RunningTasks',
        Value: service.runningCount,
        Unit: 'Count'
    });
    metrics.push({
        MetricName: 'PendingTasks',
        Value: service.pendingCount,
        Unit: 'Count'
    });

    const metricData = {
        MetricData: metrics,
        Namespace: 'Ext/AWS/ECS'
    };

    cb(null, metricData);
};

const getServiceDescription = (ecs, eventInfo, cb) => {
    ecs.describeServices({
        cluster: eventInfo.cluster,
        services: [ eventInfo.container ]
    }, (err, data) => {
        if (err) {
            return cb(err);
        }

        cb(null, _.chain(data.services)
            .find({ serviceName: eventInfo.container })
            .omit('events', 'deployments')
            .value());
    });
};

module.exports = (ecs, event, cb) => {
    const info       = common.extractInfo(event);
    const dimensions = [ { Name: 'ClusterName', Value: info.cluster }, { Name: 'ServiceName', Value: info.container } ];

    async.waterfall([
        (cb) => {
            getServiceDescription(ecs, info, cb);
        },
        (services, cb) => {
            extractMetrics(services, cb);
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

module.exports.extractMetrics        = extractMetrics;
module.exports.getServiceDescription = getServiceDescription;
