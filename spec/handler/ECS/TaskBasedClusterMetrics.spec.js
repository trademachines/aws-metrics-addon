"use strict";

const handler = require('../../../handler/ECS/TaskBasedClusterMetrics');

describe('ECS/TaskBasedClusterMetrics handler', () => {
    const noop = () => {
    };
    const eventInfo = {
        cluster: 'some-cluster',
        region: 'eu-west-1'
    };

    describe('information retrieval from ECS', () => {
        let ecsSdk;

        beforeEach(() => {
            ecsSdk = {
                describeClusters: noop
            };
        });

        it('retrieves description of cluster', (done) => {
            const clusterInfo = { clusterName: eventInfo.cluster, something: 'else' };
            spyOn(ecsSdk, 'describeClusters').and.callFake((params, cb) => {
                cb(null, { clusters: [ clusterInfo ] });
            });

            handler.getClusterDescription(ecsSdk, eventInfo, (err, data) => {
                if (err) return done.fail();

                expect(ecsSdk.describeClusters).toHaveBeenCalledWith({
                    clusters: [ eventInfo.cluster ]
                }, jasmine.any(Function));

                expect(data).toEqual(clusterInfo);
                done();
            });
        });
    });

    describe('metrics extraction', () => {
        const clusterInfo = {
            clusterName: eventInfo.cluster,
            runningTasksCount: 3,
            pendingTasksCount: 2,
            activeServicesCount: 1
        };

        it('generate RunningTasks', () => {
            handler.extractMetrics(clusterInfo, (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'RunningTasks',
                    Value: 3,
                    Unit: 'Count'
                } ]));
            })
        });

        it('generate PendingTasks', () => {
            handler.extractMetrics(clusterInfo, (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'PendingTasks',
                    Value: 2,
                    Unit: 'Count'
                } ]));
            });
        });

        it('generate ActiveServices', () => {
            handler.extractMetrics(clusterInfo, (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'ActiveServices',
                    Value: 1,
                    Unit: 'Count'
                } ]));
            });
        });
    });
});
