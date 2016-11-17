"use strict";

const _       = require('lodash');
const handler = require('../handler');
const AWS     = require('aws-sdk');

describe('handler', () => {
  let cloudwatch, resolver, logger;

  beforeEach(() => {
    spyOn(console, 'log');
    cloudwatch = {
      putMetricData: jasmine.createSpy('cloudwatch.putMetricData').and
        .callFake((x, cb) => cb())
    };
    resolver   = () => {
    };
    logger     = {
      error: () => {
      }
    };
    spyOn(AWS, 'CloudWatch').and.returnValue(cloudwatch);
  });

  function mockFn(name, metrics) {
    return jasmine.createSpy(name).and
      .callFake((y, cb) => cb(null, {MetricData: metrics}));
  }

  it('call resolved functions with event', (done) => {
    const event = {my: 'event'};
    const fn    = mockFn('resolved function', []);
    resolver    = jasmine.createSpy('resolver').and.returnValue([fn]);

    handler({}, resolver, logger, event, () => {
      expect(fn).toHaveBeenCalledWith(
        event,
        jasmine.anything()
      );
      done();
    });
  });

  it('resolved metrics are written to cloudwatch', (done) => {
    const event   = {my: 'event'};
    const metrics = [{MetricName: 'SomeMetric', Value: 1}];
    const fn      = mockFn('resolved function', metrics);
    resolver      = jasmine.createSpy('resolver').and.returnValue([fn]);

    handler({}, resolver, logger, event, () => {
      expect(cloudwatch.putMetricData)
        .toHaveBeenCalledWith({MetricData: metrics}, jasmine.anything());
      done();
    });
  });

  it('resolved metrics are written to cloudwatch', (done) => {
    const event   = {my: 'event'};
    const metrics = [{MetricName: 'SomeMetric', Value: 1}];
    const fn      = mockFn('resolved function', metrics);
    resolver      = jasmine.createSpy('resolver').and.returnValue([fn]);

    handler({}, resolver, logger, event, () => {
      expect(cloudwatch.putMetricData)
        .toHaveBeenCalledWith({MetricData: metrics}, jasmine.anything());
      done();
    });
  });

  it('resolved metrics are chunked', (done) => {
    const event   = {my: 'event'};
    const metrics = _.fill(new Array(21), {MetricName: 'SomeMetric', Value: 1});
    const fn      = mockFn('resolved function', metrics);
    resolver      = jasmine.createSpy('resolver').and.returnValue([fn]);

    handler({}, resolver, logger, event, () => {
      expect(cloudwatch.putMetricData)
        .toHaveBeenCalledWith({MetricData: metrics.slice(0, 20)},
          jasmine.anything());
      expect(cloudwatch.putMetricData)
        .toHaveBeenCalledWith({MetricData: metrics.slice(20)},
          jasmine.anything());
      done();
    });
  });
});

