# AWS Metrics Addon [![Build Status](https://travis-ci.org/trademachines/aws-metrics-addon.svg?branch=master)](https://travis-ci.org/trademachines/aws-metrics-addon) [![Coverage Status](https://coveralls.io/repos/github/trademachines/aws-metrics-addon/badge.svg?branch=master)](https://coveralls.io/github/trademachines/aws-metrics-addon?branch=master)

# Provided metrics

| Namespace | MetricName | Dimensions | Description |
| --- | --- | --- | --- |
| Ext/AWS/ECS | RegisteredInstances | ClusterName | The number of all instances inside a specific cluster. |
| Ext/AWS/ECS | HealthyRegisteredInstances | ClusterName | The number of instances in a cluster where the ECS agent is connected. |
| Ext/AWS/ECS | UnhealthyRegisteredInstances | ClusterName | The number of instances in a cluster where the ECS agent is **not** connected. |
| Ext/AWS/ECS | RunningTasks | ClusterName | The number of tasks in a cluster that have state 'running'. |
| Ext/AWS/ECS | PendingTasks | ClusterName | The number of tasks in a cluster that have state 'pending'. |
| Ext/AWS/ECS | ActiveServices | ClusterName | The number of services in a cluster that are active. |
| Ext/AWS/ECS | DesiredTasks | ClusterName, ServiceName | The number of tasks of a service in a cluster that you won't to have. |
| Ext/AWS/ECS | RunningTasks | ClusterName, ServiceName | The number of tasks of a service in a cluster that are currently running. |
| Ext/AWS/ECS | PendingTasks | ClusterName, ServiceName | The number of tasks of a service in a cluster that are currently booting up. |
| Ext/AWS/ECS | DiffDesiredAndRunningTasks | ClusterName, ServiceName | The difference between desired and running count values. |
| Ext/AWS/ECS | DiffTaskDefinition | ClusterName, ServiceName | If any of the running tasks has a different version number than the service definition this will be 1 otherwise its 0. |

# Configuration

Is done via retrieving the configuration file from S3 by utilising [the aws-lambda-config package](https://www.npmjs.com/package/aws-lambda-config).

## Current configuration

````
{
  "event-source-map": {
    "aliases": {
      "ecs-cluster": [
        "ECS/InstanceMetrics",
        "ECS/ClusterMetrics"
      ],
      "ecs-service": [
        "ECS/ServiceMetrics"
      ]
    },
    "sources": {
      "ecs.amazonaws.com": {
        "RegisterContainerInstance": "@ecs-cluster",
        "DeregisterContainerInstance": "@ecs-cluster",
        "SubmitContainerStateChange": "@ecs-service"
      }
    }
  }
}
````
