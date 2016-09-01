"use strict";

const handler = require('../../../src/handler/ECS/NumberOfRegisteredInstances');

describe('ECS/NumberOfRegisteredInstances handler', () => {
    describe('information extraction from events', () => {
        it('extract information from DeregisterContainerInstance', () => {
            const event = require('../_fixtures/ecs-DeregisterContainerInstance.json');

            expect(handler.extract(event)).toEqual({cluster: 'some-cluster'});
        });

        it('extract information from RegisterContainerInstance', () => {
            const event = require('../_fixtures/ecs-RegisterContainerInstance.json');

            expect(handler.extract(event)).toEqual({cluster: 'some-cluster'});
        });

        it('extract information from SubmitContainerStateChange', () => {
            const event = require('../_fixtures/ecs-SubmitContainerStateChange.json');

            expect(handler.extract(event)).toEqual({cluster: 'some-cluster'});
        });
    });
});
