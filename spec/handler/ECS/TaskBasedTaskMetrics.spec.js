"use strict";
const _       = require('lodash');
const handler = require('../../../handler/ECS/TaskBasedTaskMetrics');

describe('ECS/TaskBasedTaskMetrics handler', () => {
    let ecsSdk;
    const noop      = () => {
    };
    const eventInfo = {
        cluster: 'some-cluster',
        region: 'eu-west-1'
    };

    function service(name, desired, running, pending, other) {
        return _.assign({
            serviceName: name,
            desiredCount: desired,
            runningCount: running,
            pendingCount: pending
        }, other || {});
    }

    function mockEcsSdk(listServicesResponses, describeServicesResponse) {
        let listServicesCall     = 0;
        let describeServicesCall = 0;

        spyOn(ecsSdk, 'listServices').and.callFake((params, cb) => {
            cb(null, listServicesResponses[ listServicesCall++ ]);
        });
        spyOn(ecsSdk, 'describeServices').and.callFake((params, cb) => {
            cb(null, describeServicesResponse[ describeServicesCall++ ]);
        });
    }

    describe('information retrieval from ECS', () => {
        beforeEach(() => {
            ecsSdk = {
                listServices: noop,
                describeServices: noop
            };
        });

        it('retrieves description of cluster with few number of services', (done) => {
            const clusterInfo = { clusterName: eventInfo.cluster, something: 'else' };

            const service1 = service('service-one', 1, 2, 3);
            const service2 = service('service-two', 4, 5, 6);

            const serviceArns = [
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-one',
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-two'
            ];
            mockEcsSdk(
                [ {
                    serviceArns: serviceArns,
                    nextToken: null
                } ],
                [ {
                    services: [
                        service1,
                        service2
                    ]
                } ]
            );

            handler.getServicesDescription(ecsSdk, eventInfo, (err, data) => {
                if (err) return done.fail();

                expect(ecsSdk.listServices).toHaveBeenCalledWith(jasmine.objectContaining({
                    cluster: eventInfo.cluster
                }), jasmine.any(Function));

                expect(ecsSdk.describeServices).toHaveBeenCalledWith(jasmine.objectContaining({
                    cluster: eventInfo.cluster,
                    services: serviceArns
                }), jasmine.any(Function));

                expect(data).toEqual([ service1, service2 ]);
                done();
            });
        });

        it('retrieves description of cluster with more services', (done) => {
            const clusterInfo = { clusterName: eventInfo.cluster, something: 'else' };

            const service1 = service('service-one', 1, 2, 3);
            const service2 = service('service-two', 4, 5, 6);
            const service3 = service('service-three', 7, 8, 9);

            const serviceArns = [
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-one',
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-two',
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-three'
            ];
            mockEcsSdk(
                [ {
                    serviceArns: serviceArns.slice(0, 2),
                    nextToken: 1
                }, {
                    serviceArns: serviceArns.slice(2),
                    nextToken: null
                } ],
                [ {
                    services: [
                        service1,
                        service2
                    ]
                }, {
                    services: [
                        service3
                    ]
                } ]
            );

            handler.getServicesDescription(ecsSdk, eventInfo, (err, data) => {
                if (err) return done.fail();

                expect(ecsSdk.listServices).toHaveBeenCalledWith(jasmine.objectContaining({
                    cluster: eventInfo.cluster
                }), jasmine.any(Function));
                expect(ecsSdk.listServices).toHaveBeenCalledTimes(2);

                expect(ecsSdk.describeServices).toHaveBeenCalledWith({
                    cluster: eventInfo.cluster,
                    services: serviceArns.slice(0, 2)
                }, jasmine.any(Function));

                expect(ecsSdk.describeServices).toHaveBeenCalledWith({
                    cluster: eventInfo.cluster,
                    services: serviceArns.slice(2)
                }, jasmine.any(Function));

                expect(data).toEqual([ service1, service2, service3 ]);
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

        it('generate metrics per service', () => {
            handler.extractMetrics([ service('one') ], [], (err, metrics) => {
                expect(metrics.MetricData.length).toEqual(3);
            });
            handler.extractMetrics([ service('one'), service('two') ], [], (err, metrics) => {
                expect(metrics.MetricData.length).toEqual(6);
            });
        });

        it('generate DesiredTasks', () => {
            handler.extractMetrics([ service('x', 1, 2, 3) ], [], (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'DesiredTasks',
                    Dimensions: [{ Name: 'ServiceName', Value:'x'}],
                    Value: 1,
                    Unit: 'Count'
                } ]));
            })
        });

        it('generate RunningTasks', () => {
            handler.extractMetrics([ service('x', 1, 2, 3) ], [], (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'RunningTasks',
                    Dimensions: [{ Name: 'ServiceName', Value:'x'}],
                    Value: 2,
                    Unit: 'Count'
                } ]));
            })
        });

        it('generate PendingTasks', () => {
            handler.extractMetrics([ service('x', 1, 2, 3) ], [], (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([ {
                    MetricName: 'PendingTasks',
                    Dimensions: [{ Name: 'ServiceName', Value:'x'}],
                    Value: 3,
                    Unit: 'Count'
                } ]));
            })
        });
    });
});
