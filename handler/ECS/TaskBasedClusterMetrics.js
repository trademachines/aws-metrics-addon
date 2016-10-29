"use strict";
const _      = require('lodash');
const async  = require('neo-async');
const common = require('./common');

const extractMetricsWithDebug = (event, cluster, cb) => {
    console.log('cluster-based-metrics', JSON.stringify(event), JSON.stringify(cluster));

    extractMetrics(cluster, cb);
};

const extractMetrics = (cluster, cb) => {
    let metrics = [];

    metrics.push({
        MetricName: 'RunningTasks',
        Value: cluster.runningTasksCount,
        Unit: 'Count'
    });
    metrics.push({
        MetricName: 'PendingTasks',
        Value: cluster.pendingTasksCount,
        Unit: 'Count'
    });
    metrics.push({
        MetricName: 'ActiveServices',
        Value: cluster.activeServicesCount,
        Unit: 'Count'
    });

    const metricData = {
        MetricData: metrics,
        Namespace: 'Ext/AWS/ECS'
    };

    cb(null, metricData);
};

const getClusterDescription = (ecs, eventInfo, cb) => {
    ecs.describeClusters({ clusters: [ eventInfo.cluster ] }, (err, data) => {
        if (err) {
            return cb(err);
        }

        return cb(null, _.find(data.clusters, { clusterName: eventInfo.cluster }));
    });
};

module.exports = (ecs, event, cb) => {
    const info       = common.extractInfo(event);
    const dimensions = [ { Name: 'ClusterName', Value: info.cluster } ];

    async.waterfall([
        (cb) => {
            getClusterDescription(ecs, info, cb);
        },
        (clusterData, cb) => {
            extractMetricsWithDebug(event, clusterData, cb);
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
module.exports.getClusterDescription = getClusterDescription;
