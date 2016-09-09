"use strict";
const _        = require('lodash');
const async    = require('neo-async');

module.exports = (ecs, cloudwatch, eventMap, resolver, logger, event, done) => {
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
                    _.chunk(metric.MetricData, 20), 3,
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
        functions, 3,
        callFunctions,
        writeMetrics
    );
};
