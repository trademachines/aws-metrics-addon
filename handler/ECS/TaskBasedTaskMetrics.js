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

const getServiceByDeploymentId = (ecs, cluster, serviceDeploymentId, cb) => {
    let token   = null;
    let service = null;

    async.doUntil(
        (cb) => async.seq(
            (t, cb) => ecs.listServices({ cluster: cluster, nextToken: t }, cb),
            (response, cb) => ecs.describeServices({
                cluster: cluster,
                services: response.serviceArns
            }, (err, data) => {
                if (err) {
                    return cb(err);
                }

                cb(null, [ response.nextToken, data.services ]);
            })
        )(token, cb),
        (data) => {
            service = _.find(
                data[ 1 ],
                (s) => _.map(s.deployments, 'id').indexOf(serviceDeploymentId) >= 0
            );

            const lastToken = token;
            token           = data[ 0 ];

            return service || lastToken === token;
        },
        (err) => cb(err, service)
    )
};

const getServiceDescription = (ecs, eventInfo, cb) => {
    async.waterfall([
        (cb) => {
            ecs.describeTasks({
                cluster: eventInfo.cluster,
                tasks: [ eventInfo.task ]

            }, cb)
        },
        (data, cb) => cb(null, _.get(data, 'tasks.0.startedBy')),
        (serviceId, cb) => getServiceByDeploymentId(ecs, eventInfo.cluster, serviceId, cb),
        (service, cb) => cb(null, _.omit(service, 'event', 'deployments'))
    ], cb);
};

const addDimensions = (info, service, metrics, cb) => {
    const dimensions = [ { Name: 'ClusterName', Value: info.cluster }, {
        Name: 'ServiceName',
        Value: service.serviceName
    } ];

    metrics.MetricData = _.map(metrics.MetricData, (m) => {
        m.Dimensions = dimensions;
        return m;
    });

    cb(null, metrics);
};

module.exports = (ecs, event, cb) => {
    const info = common.extractInfo(event);

    async.auto(
        {
            service: (cb) => getServiceDescription(ecs, info, cb),
            metrics: [ 'service', (results, cb) => extractMetrics(results.service, cb) ],
            withDimensions: [ 'metrics', (results, cb) => addDimensions(info, results.service, results.metrics, cb) ]
        },
        (err, results) => cb(err, results.withDimensions)
    );
};

module.exports.extractMetrics        = extractMetrics;
module.exports.getServiceDescription = getServiceDescription;
