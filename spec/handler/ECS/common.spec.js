"use strict";

const handler = require('../../../handler/ECS/common');

describe('common stuff for ECS events', () => {
    const noop      = () => {
    };
    const eventInfo = {
        cluster: 'some-cluster',
        region: 'eu-west-1'
    };
    describe('information extraction from events', () => {
        it('extract information from DeregisterContainerInstance', () => {
            const event = require('../_fixtures/ecs-DeregisterContainerInstance.json');

            expect(handler.extractInfo(event)).toEqual(jasmine.objectContaining(eventInfo));
        });

        it('extract information from RegisterContainerInstance', () => {
            const event = require('../_fixtures/ecs-RegisterContainerInstance.json');

            expect(handler.extractInfo(event)).toEqual(jasmine.objectContaining(eventInfo));
        });

        it('extract information from SubmitContainerStateChange', () => {
            const event = require('../_fixtures/ecs-SubmitContainerStateChange.json');

            expect(handler.extractInfo(event)).toEqual(jasmine.objectContaining(eventInfo));
            expect(handler.extractInfo(event)).toEqual(jasmine.objectContaining({ container: 'foobar' }));
        });
    });
});
