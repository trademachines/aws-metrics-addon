const AWS      = require('aws-sdk');
const handler  = require('./handler');
const resolver = require('./resolver');

const ecs        = new AWS.ECS();
const cloudWatch = new AWS.CloudWatch();

exports.handleMetric = (event, context) => {
    handler(ecs, cloudWatch, resolver, console, event);
};
