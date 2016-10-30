"use strict";
const _        = require('lodash');
const async    = require('neo-async');

module.exports = (ecs, cloudwatch, eventMap, resolver, logger, event, done) => {
    console.log(`Received event ${JSON.stringify(event)}`);

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

        console.log(`Writing results ${JSON.stringify(results)}`);
        let metricCount = 0;

        async.eachLimit(
            results, 3,
            (metric, cb) => {
                metricCount += metric.MetricData.length;

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

                cloudwatch.putMetricData({ MetricData: [{
                    MetricName: 'MetricDataWritten',
                    Value: metricCount,
                    Unit: 'Count'
                }], Namespace: 'Ext/AWS' }, () => {
                    if (err) {
                        logger.error(err);
                    }

                    if (done) {
                        done(err);
                    }
                });
            }
        );
    };

    async.mapLimit(
        functions, 3,
        callFunctions,
        writeMetrics
    );
};
