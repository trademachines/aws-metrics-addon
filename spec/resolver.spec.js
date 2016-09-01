"use strict";

const loader = require('../src/resolver');

describe('resolver', () => {
    describe('resolve flat metrics', () => {
        it('one metric', () => {
            const map     = {
                sources: {
                    "ecs.amazonaws.com": {
                        RegisterContainerInstance: "ECS/NumberOfRegisteredInstances"
                    }
                }
            };
            const metrics = loader.metrics(map, 'ecs.amazonaws.com', 'RegisterContainerInstance');

            expect(metrics).toEqual([ "ECS/NumberOfRegisteredInstances" ]);
        });

        it('multiple metrics', () => {
            const map     = {
                sources: {
                    "ecs.amazonaws.com": {
                        RegisterContainerInstance: [ "ECS/NumberOfRegisteredInstances", "ECS/SomethingElse" ]
                    }
                }
            };
            const metrics = loader.metrics(map, 'ecs.amazonaws.com', 'RegisterContainerInstance');

            expect(metrics).toEqual([ "ECS/NumberOfRegisteredInstances", "ECS/SomethingElse" ]);
        });
    });

    describe('resolve aliases', () => {
        it('one alias', () => {
            const map     = {
                aliases: {
                    one: "ECS/NumberOfRegisteredInstances"
                },
                sources: {
                    "ecs.amazonaws.com": {
                        RegisterContainerInstance: "@one"
                    }
                }
            };
            const metrics = loader.metrics(map, 'ecs.amazonaws.com', 'RegisterContainerInstance');

            expect(metrics).toEqual([ "ECS/NumberOfRegisteredInstances" ]);
        });

        it('multiple aliases', () => {
            const map     = {
                aliases: {
                    one: "ECS/NumberOfRegisteredInstances",
                    two: "ECS/SomethingElse"
                },
                sources: {
                    "ecs.amazonaws.com": {
                        RegisterContainerInstance: [ "@one", "@two" ]
                    }
                }
            };
            const metrics = loader.metrics(map, 'ecs.amazonaws.com', 'RegisterContainerInstance');

            expect(metrics).toEqual([ "ECS/NumberOfRegisteredInstances", "ECS/SomethingElse" ]);
        });

        it('mixed reference and alias in source', () => {
            const map     = {
                aliases: {
                    two: "ECS/SomethingElse"
                },
                sources: {
                    "ecs.amazonaws.com": {
                        RegisterContainerInstance: [ "ECS/NumberOfRegisteredInstances", "@two" ]
                    }
                }
            };
            const metrics = loader.metrics(map, 'ecs.amazonaws.com', 'RegisterContainerInstance');

            expect(metrics).toEqual([ "ECS/NumberOfRegisteredInstances", "ECS/SomethingElse" ]);
        });

        it('mixed reference and alias in reference', () => {
            const map     = {
                aliases: {
                    one: ["ECS/NumberOfRegisteredInstances", "@two"],
                    two: "ECS/SomethingElse"
                },
                sources: {
                    "ecs.amazonaws.com": {
                        RegisterContainerInstance: "@one"
                    }
                }
            };
            const metrics = loader.metrics(map, 'ecs.amazonaws.com', 'RegisterContainerInstance');

            expect(metrics).toEqual([ "ECS/NumberOfRegisteredInstances", "ECS/SomethingElse" ]);
        });

        it('nested references', () => {
            const map     = {
                aliases: {
                    one: "@two",
                    two: ["@three", "@four"],
                    three: ["ECS/NumberOfRegisteredInstances"],
                    four: "@five",
                    five: "ECS/SomethingElse"
                },
                sources: {
                    "ecs.amazonaws.com": {
                        RegisterContainerInstance: ["@one"]
                    }
                }
            };
            const metrics = loader.metrics(map, 'ecs.amazonaws.com', 'RegisterContainerInstance');

            expect(metrics).toEqual([ "ECS/NumberOfRegisteredInstances", "ECS/SomethingElse" ]);
        });
    });
});

