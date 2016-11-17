const AWS      = require('aws-sdk');
const config   = require('aws-lambda-config');
const handler  = require('./handler');
const resolver = require('./resolver');

exports.handle = (event, context) => {
    config.getConfig(context, (err, cfg) => {
        if (err) return console.error(err);

        handler(cfg[ 'event-source-map' ], resolver, console, event);
    });
};
