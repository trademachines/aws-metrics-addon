const AWS      = require('aws-sdk');
const config   = require('aws-lambda-config');
const handler  = require('./handler');
const resolver = require('./resolver');

const ecs        = new AWS.ECS();
const cloudWatch = new AWS.CloudWatch();

exports.handleMetric = (event, context) => {
    config.getConfig(context, (err, cfg) => {
        if (err) return console.error(err);

        handler(ecs, cloudWatch, cfg[ 'event-source-map' ], resolver, console, event);
    });
};
