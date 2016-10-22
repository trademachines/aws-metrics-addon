"use strict";
const _       = require('lodash');
const handler = require('../../../handler/ECS/TaskBasedTaskMetrics');

describe('ECS/TaskBasedTaskMetrics handler', () => {
    let ecsSdk;
    const noop      = () => {
    };
    const eventInfo = {
        task: 'some-task-arn',
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

    function mockEcsSdk(describeTasksResponse, listServicesResponses, describeServicesResponse) {
        let listServicesCall     = 0;
        let describeServicesCall = 0;

        spyOn(ecsSdk, 'describeTasks').and.callFake((params, cb) => {
            cb(null, describeTasksResponse);
        });
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
                describeTasks: noop,
                listServices: noop,
                describeServices: noop
            };
        });

        it('retrieves description of cluster with few number of services', (done) => {
            const clusterInfo = { clusterName: eventInfo.cluster, something: 'else' };

            const service1 = service('service-one', 1, 2, 3);
            const service2 = service('service-two', 4, 5, 6, { deployments: [ { id: 'service-two-deployment-id' } ] });

            const serviceArns = [
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-one',
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-two'
            ];

            mockEcsSdk(
                { tasks: [ { startedBy: 'service-two-deployment-id' } ] },
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

            handler.getServiceDescription(ecsSdk, eventInfo, (err, data) => {
                if (err) return done.fail();

                expect(ecsSdk.listServices).toHaveBeenCalledWith(jasmine.objectContaining({
                    cluster: eventInfo.cluster
                }), jasmine.any(Function));

                expect(ecsSdk.describeServices).toHaveBeenCalledWith(jasmine.objectContaining({
                    cluster: eventInfo.cluster,
                    services: serviceArns
                }), jasmine.any(Function));

                expect(data).toEqual(jasmine.objectContaining({
                    serviceName: 'service-two'
                }));
                done();
            });
        });

        it('retrieves description of cluster with more services', (done) => {
            const clusterInfo = { clusterName: eventInfo.cluster, something: 'else' };

            const service1 = service('service-one', 1, 2, 3);
            const service2 = service('service-two', 4, 5, 6, { deployments: [ { id: 'service-two-deployment-id' } ] });

            const serviceArns = [
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-one',
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-two'
            ];

            mockEcsSdk(
                { tasks: [ { startedBy: 'service-two-deployment-id' } ] },
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

            handler.getServiceDescription(ecsSdk, eventInfo, (err, data) => {
                if (err) return done.fail();

                expect(ecsSdk.listServices).toHaveBeenCalledWith(jasmine.objectContaining({
                    cluster: eventInfo.cluster
                }), jasmine.any(Function));

                expect(ecsSdk.describeServices).toHaveBeenCalledWith(jasmine.objectContaining({
                    cluster: eventInfo.cluster,
                    services: serviceArns
                }), jasmine.any(Function));

                expect(data).toEqual(jasmine.objectContaining({
                    serviceName: 'service-two'
                }));
                done();
            });
        });
        it('retrieves description of cluster with more services', (done) => {
            const clusterInfo = { clusterName: eventInfo.cluster, something: 'else' };

            const service1 = service('service-one', 1, 2, 3);
            const service2 = service('service-two', 4, 5, 6, { deployments: [ { id: 'service-two-deployment-id' } ] });
            const service3 = service('service-three', 7, 8, 9, { deployments: [ { id: 'service-three-deployment-id' } ] });

            const serviceArns = [
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-one',
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-two',
                'arn:aws:ecs:eu-west-1:xxxxxxxxxxxx:service/service-three'
            ];


            mockEcsSdk(
                { tasks: [ { startedBy: 'service-three-deployment-id' } ] },

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

            handler.getServiceDescription(ecsSdk, eventInfo, (err, data) => {
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

                expect(data).toEqual(jasmine.objectContaining({
                    serviceName: 'service-three'
                }));
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
