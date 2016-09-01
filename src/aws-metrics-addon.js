"use strict";
const AWS      = require('aws-sdk');
const resolver = require('./resolver');
const _        = require('lodash');
const async    = require('neo-async');
const eventMap = require('./aws-event-source-map.json');

exports.handleMetric = (event, context) => {
    const ecs        = new AWS.ECS();
    const cloudWatch = new AWS.CloudWatch();

    const functions     = resolver(eventMap, event.eventSource, event.eventName);
    const callFunctions = (f, cb) => {
        try {
            f(ecs, event, cb);
        } catch (e) {
            console.error(e);
        }
    };
    const writeMetrics  = (err, results) => {
        if (err) {

            return console.error(err);
        }

        async.each(
            results,
            (metric, cb) => cloudWatch.putMetricData(metric, cb),
            (err) => {
                if (err) {
                    console.error(err);
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
