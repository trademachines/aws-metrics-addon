"use strict";
const _              = require('lodash');
const async          = require('neo-async');
const common         = require('./common');
const serviceMetrics = require('./ServiceMetrics');

const extractMetrics = (ecs, eventInfo, services, cb) => {
    let metric = { MetricData: [] };

    async.eachLimit(
        services, 3,
        (s, cb) => {
            async.waterfall([
                (cb) => serviceMetrics.getTasksForService(ecs, eventInfo, s, cb),
                (tasks, cb) => serviceMetrics.extractMetrics(eventInfo, s, tasks, cb),
                (m, cb) => {
                    metric.MetricData = _.concat(metric.MetricData, m.MetricData);
                    metric.Namespace  = m.Namespace;

                    cb();
                }
            ], cb)
        }, (err) => {
            cb(err, metric);
        });
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

            return service || !(token = data[ 0 ]);
        },
        (err) => {
            if (err) {
                return cb(err);
            }

            if (!service) {
                return cb(new Error(`Cant't find service with deployment id ${serviceDeploymentId}`));
            }

            cb(null, service)
        }
    );
};

const getServices = (ecs, eventInfo, cb) => {
    let token    = null;
    let services = [];

    async.doUntil(
        (cb) => async.seq(
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
        )(token, cb),
        (data) => {
            services = _.concat(services, data[ 1 ]);

            return !(token = data[ 0 ]);
        },
        (err) => {
            if (err) {
                return cb(err);
            }

            cb(null, services)
        }
    );
};

module.exports = (ecs, event, cb) => {
    const info = common.extractInfo(event);

    async.waterfall([
        (cb) => getServices(ecs, info, cb),
        (services, cb) => extractMetrics(ecs, info, services, cb)
    ], cb);
};

module.exports.extractMetrics = extractMetrics;
module.exports.getServices    = getServices;
