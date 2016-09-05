"use strict";
const _        = require('lodash');
const async    = require('neo-async');
const eventMap = require('./aws-event-source-map.json');

module.exports = (ecs, cloudwatch, resolver, logger, event, done) => {
    const functions     = resolver(eventMap, event.eventSource, event.eventName);
    const callFunctions = (f, cb) => {
        try {
            f(ecs, event, cb);
        } catch (e) {
            logger.error(e);
        }
    };
    const writeMetrics  = (err, results) => {
        if (err) {
            return logger.error(err);
        }

        async.eachLimit(
            results, 3,
            (metric, cb) => {
                async.eachLimit(
                    _.chunk(metric.MetricData, 20), 2,
                    (chunk, cb) => cloudwatch.putMetricData(_.assign({}, metric, { MetricData: chunk }), cb),
                    cb
                );
            },
            (err) => {
                if (err) {
                    logger.error(err);
                }

                if (done) {
                    done(err);
                }
            }
        );
    };

    async.mapLimit(
        functions, 2,
        callFunctions,
        writeMetrics
    );
};
