"use strict";

const _       = require('lodash');
const handler = require('../handler');

describe('handler', () => {
    let ecs, cloudwatch, resolver, logger;

    beforeEach(() => {
        ecs        = {};
        cloudwatch = {
            putMetricData: jasmine.createSpy('cloudwatch.putMetricData').and.callFake((x, cb) => cb())
        };
        resolver   = () => {
        };
        logger     = {
            error: () => {
            }
        }
    });

    function mockFn(name, metrics) {
        return jasmine.createSpy(name).and.callFake((x, y, cb) => cb(null, { MetricData: metrics }));
    }

    it('call resolved functions with event', (done) => {
        const event = { my: 'event' };
        const fn    = mockFn('resolved function', []);
        resolver    = jasmine.createSpy('resolver').and.returnValue([ fn ]);

        handler(ecs, cloudwatch, resolver, logger, event, () => {
            expect(fn).toHaveBeenCalledWith(jasmine.anything(), event, jasmine.anything());
            done();
        });
    });

    it('resolved metrics are written to cloudwatch', (done) => {
        const event   = { my: 'event' };
        const metrics = [ { MetricName: 'SomeMetric', Value: 1 } ];
        const fn      = mockFn('resolved function', metrics);
        resolver      = jasmine.createSpy('resolver').and.returnValue([ fn ]);

        handler(ecs, cloudwatch, resolver, logger, event, () => {
            expect(cloudwatch.putMetricData).toHaveBeenCalledWith({ MetricData: metrics }, jasmine.anything());
            done();
        });
    });

    it('resolved metrics are written to cloudwatch', (done) => {
        const event   = { my: 'event' };
        const metrics = [ { MetricName: 'SomeMetric', Value: 1 } ];
        const fn      = mockFn('resolved function', metrics);
        resolver      = jasmine.createSpy('resolver').and.returnValue([ fn ]);

        handler(ecs, cloudwatch, resolver, logger, event, () => {
            expect(cloudwatch.putMetricData).toHaveBeenCalledWith({ MetricData: metrics }, jasmine.anything());
            done();
        });
    });

    it('resolved metrics are chunked', (done) => {
        const event   = { my: 'event' };
        const metrics = _.fill(new Array(21), { MetricName: 'SomeMetric', Value: 1 });
        const fn      = mockFn('resolved function', metrics);
        resolver      = jasmine.createSpy('resolver').and.returnValue([ fn ]);

        handler(ecs, cloudwatch, resolver, logger, event, () => {
            expect(cloudwatch.putMetricData).toHaveBeenCalledTimes(2);
            done();
        });
    });
});

