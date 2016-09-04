"use strict";

const handler = require('../../../handler/ECS/InstanceBasedClusterMetrics');

describe('ECS/InstanceBasedClusterMetrics handler', () => {
    const noop      = () => {
    };
    const eventInfo = {
        cluster: 'some-cluster',
        region: 'eu-west-1'
    };

    describe('information retrieval from ECS', () => {
        let ecsSdk;

        beforeEach(() => {
            ecsSdk = {
                listContainerInstances: noop,
                describeContainerInstances: noop
            };
        });

        it('retrieves list of containerInstances', (done) => {
            spyOn(ecsSdk, 'listContainerInstances').and.callFake((params, cb) => {
                cb(null, { containerInstanceArns: [ 'one', 'two' ] });
            });

            handler.getContainerInstances(ecsSdk, eventInfo, (err, data) => {
                if (err) return done.fail();

                expect(data).toEqual([ 'one', 'two' ]);
                done();
            });
        });

        it('retrieves description of containerInstances', (done) => {
            spyOn(ecsSdk, 'describeContainerInstances').and.callFake((params, cb) => {
                cb(null, { containerInstances: [ 'one', 'two' ] });
            });

            handler.getContainerInstancesDescription(ecsSdk, eventInfo, [ '#one', '#two' ], (err, data) => {
                if (err) return done.fail();

                expect(ecsSdk.describeContainerInstances).toHaveBeenCalledWith({
                    cluster: eventInfo.cluster,
                    containerInstances: [ '#one', '#two' ]
                }, jasmine.any(Function));

                expect(data).toEqual([ 'one', 'two' ]);
                done();
            });
        });
    });

    describe('metrics extraction', () => {
        it('generate RegisteredInstances based on number of instances', () => {
            handler.extractMetrics(['one', 'two'], (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([{
                    MetricName: 'RegisteredInstances',
                    Value: 2,
                    Unit: 'Count'
                }]));
            })
        });

        it('generate HealthyRegisteredInstances based on number of instances with connected agent', () => {
            handler.extractMetrics([{agentConnected: true}, {agentConnected:false}], (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([{
                    MetricName: 'HealthyRegisteredInstances',
                    Value: 1,
                    Unit: 'Count'
                }]));
            });
        });

        it('generate UnhealthyRegisteredInstances based on number of instances with connected agent', () => {
            handler.extractMetrics([{agentConnected: true}, {agentConnected:false}], (err, metrics) => {
                expect(metrics.MetricData).toEqual(jasmine.arrayContaining([{
                    MetricName: 'UnhealthyRegisteredInstances',
                    Value: 1,
                    Unit: 'Count'
                }]));
            });
        });
    });
});
