# AWS Metrics Addon [![Build Status](https://travis-ci.org/trademachines/aws-metrics-addon.svg?branch=master)](https://travis-ci.org/trademachines/aws-metrics-addon)

# Provided metrics

| Namespace | MetricName | Dimensions | Description |
| --- | --- | --- | --- |
| Ext/AWS/ECS | NumberOfRegisteredInstances | ClusterName | The number of all instances inside a specific cluster. |
| Ext/AWS/ECS | NumberOfHealthyRegisteredInstances | ClusterName | The number of instances in a cluster where the ECS agent is connected. |
| Ext/AWS/ECS | NumberOfUnhealthyRegisteredInstances | ClusterName | The number of instances in a cluster where the ECS agent is **not** connected. |

