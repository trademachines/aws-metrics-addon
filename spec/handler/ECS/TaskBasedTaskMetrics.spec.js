"use strict";
const _       = require('lodash');
const handler = require('../../../handler/ECS/TaskBasedTaskMetrics');

describe('ECS/TaskBasedTaskMetrics handler', () => {
    let ecsSdk;
    const noop      = () => {
    };
    const eventInfo = {
        region: 'eu-west-1',
        cluster: 'some-cluster',
        container: 'foobar'
    };

    function service(name, desired, running, pending, other) {
        return _.assign({
            serviceName: name,
            desiredCount: desired,
            runningCount: running,
            pendingCount: pending
        }, other || {});
    }

    describe('information retrieval from ECS', () => {
        beforeEach(() => {
            ecsSdk = {
                listServices: noop,
                describeServices: noop
            };
        });

        it('retrieves description of service', (done) => {
            const s = service('foobar', 1, 2, 3);

            spyOn(ecsSdk, 'describeServices').and.callFake((params, cb) => {
                cb(null, { services: [ s ] });
            });

            handler.getServiceDescription(ecsSdk, eventInfo, (err, data) => {
                if (err) return done.fail();

                expect(ecsSdk.describeServices).toHaveBeenCalledWith({
                    cluster: eventInfo.cluster,
                    services: [ eventInfo.container ]
                }, jasmine.any(Function));

                expect(data).toEqual(s);
                done();
            });
        });
    });

    describe('metrics extraction', () => {
        it('generate DesiredTasks', () => {
            handler.extractMetrics(service('x', 1, 2, 3), (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'DesiredTasks',
                    Value: 1,
                    Unit: 'Count'
                } ]));
            })
        });

        it('generate RunningTasks', () => {
            handler.extractMetrics(service('x', 1, 2, 3), (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'RunningTasks',
                    Value: 2,
                    Unit: 'Count'
                } ]));
            })
        });

        it('generate PendingTasks', () => {
            handler.extractMetrics(service('x', 1, 2, 3), (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'PendingTasks',
                    Value: 3,
                    Unit: 'Count'
                } ]));
            })
        });
    });
});
