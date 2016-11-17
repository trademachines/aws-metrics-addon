'use strict';

const AWS   = require('aws-sdk');
const _     = require('lodash');
const async = require('neo-async');

const extractMetrics = (images, cb) => {
  const imageSizes = _.map(images, 'imageSizeInBytes');
  let metrics      = [];

  metrics.push({
    MetricName: 'Images',
    Value: images.length,
    Unit: 'Count'
  });
  metrics.push({
    MetricName: 'ImagesSize',
    Unit: 'Bytes',
    StatisticValues: {
      SampleCount: images.length,
      Maximum: _.max(imageSizes),
      Minimum: _.min(imageSizes),
      Sum: _.sum(imageSizes)
    }
  });

  const metricData = {
    MetricData: metrics,
    Namespace: 'Ext/AWS/ECR'
  };

  cb(null, metricData);
};

const getRepositoryImages = (ecr, repoName, cb) => {
  let token  = null;
  let images = [];

  async.doUntil(
    (cb) => async.seq(
      (t, cb) => ecr.listImages({repositoryName: repoName, nextToken: t}, cb),
      (response, cb) => ecr.describeImages({
        repositoryName: repoName,
        imageIds: response.imageIds
      }, (err, data) => {
        if (err) {
          return cb(err);
        }

        cb(null, [response.nextToken, data.imageDetails]);
      })
    )(token, cb),
    (data) => {
      images = _.concat(images, data[1]);

      return !(token = data[0]);
    },
    (err) => {
      if (err) {
        return cb(err);
      }

      cb(null, images)
    }
  );
};

module.exports = (event, cb) => {
  const ecr        = new AWS.ECR();
  const repoName   = _.get(event, 'requestParameters.repositoryName');
  const dimensions = [{Name: 'RepositoryName', Value: repoName}];

  async.waterfall([
    (cb) => {
      getRepositoryImages(ecr, repoName, cb);
    },
    (images, cb) => {
      extractMetrics(images, cb);
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

module.exports.extractMetrics      = extractMetrics;
module.exports.getRepositoryImages = getRepositoryImages;
