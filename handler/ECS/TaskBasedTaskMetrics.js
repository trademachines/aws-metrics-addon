"use strict";
const _      = require('lodash');
const async  = require('neo-async');
const common = require('./common');

const extractMetrics = (services, dimensions, cb) => {
    let metrics = [];

    _.each(services, (s) => {
        const serviceDimensions = _.concat(dimensions, { Name: 'ServiceName', Value: s.serviceName });
        metrics.push({
            MetricName: 'DesiredTasks',
            Dimensions: serviceDimensions,
            Value: s.desiredCount,
            Unit: 'Count'
        });
        metrics.push({
            MetricName: 'RunningTasks',
            Dimensions: serviceDimensions,
            Value: s.runningCount,
            Unit: 'Count'
        });
        metrics.push({
            MetricName: 'PendingTasks',
            Dimensions: serviceDimensions,
            Value: s.pendingCount,
            Unit: 'Count'
        });
    });

    const metricData = {
        MetricData: metrics,
        Namespace: 'Ext/AWS/ECS'
    };

    cb(null, metricData);
};

const getServicesDescription = (ecs, eventInfo, cb) => {
    let services = [];
    let token    = null;

    async.doWhilst(
        (cb) => {
            async.seq(
                (t, cb) => ecs.listServices({ cluster: eventInfo.cluster, nextToken: t }, cb),
                (response, cb) => ecs.describeServices({
                    cluster: eventInfo.cluster,
                    services: response.serviceArns
                }, (err, data) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, [ response.nextToken, data.services ]);
                })
            )(token, cb);
        },
        (data) => {
            services.push(
                _.chain(data[ 1 ])
                    .map(s => _.omit(s, 'events', 'deployments'))
                    .filter(s => ({ status: 'ACTIVE' })).value()
            );
            return !!(token = data[ 0 ]);
        },
        (err) => {
            cb(err, _.flatten(services));
        }
    );
};

module.exports = (ecs, event, cb) => {
    const info       = common.extractInfo(event);
    const dimensions = [ { Name: 'ClusterName', Value: info.cluster } ];

    async.waterfall([
        (cb) => {
            getServicesDescription(ecs, info, cb);
        },
        (services, cb) => {
            extractMetrics(services, dimensions, cb);
        }
    ], cb);
};

module.exports.extractMetrics         = extractMetrics;
module.exports.getServicesDescription = getServicesDescription;
