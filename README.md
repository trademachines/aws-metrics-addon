# AWS Metrics Addon [![Build Status](https://travis-ci.org/trademachines/aws-metrics-addon.svg?branch=master)](https://travis-ci.org/trademachines/aws-metrics-addon)

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
