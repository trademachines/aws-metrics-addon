'use strict';

const AWS    = require('aws-sdk');
const _      = require('lodash');
const async  = require('neo-async');
const common = require('./common');

const extractMetricsWithDebug = (event, info, service, tasks, cb) => {
  console.log('task-based-metrics', JSON.stringify(event),
    JSON.stringify(service), JSON.stringify(tasks));

  extractMetrics(info, service, tasks, cb);
};

const extractMetrics = (info, service, tasks, cb) => {
  const tasksArns  = _.uniq(_.map(tasks, 'taskDefinitionArn'));
  const dimensions = [{Name: 'ClusterName', Value: info.cluster}, {
    Name: 'ServiceName',
    Value: service.serviceName
  }];
  let metrics      = [];

  metrics.push({
    MetricName: 'DesiredTasks',
    Value: service.desiredCount,
    Unit: 'Count'
  });
  metrics.push({
    MetricName: 'RunningTasks',
    Value: service.runningCount,
    Unit: 'Count'
  });
  metrics.push({
    MetricName: 'PendingTasks',
    Value: service.pendingCount,
    Unit: 'Count'
  });
  metrics.push({
    MetricName: 'DiffDesiredAndRunningTasks',
    Value: Math.abs(service.desiredCount - service.runningCount),
    Unit: 'Count'
  });
  metrics.push({
    MetricName: 'DiffTaskDefinition',
    Value: tasksArns.length === 0 || (tasksArns.length === 1 && tasksArns[0]
                                                                === service.taskDefinition)
      ? 0 : 1,
    Unit: 'Count'
  });

  const metricData = {
    MetricData: _.map(metrics, m => {
      m.Dimensions = dimensions;
      return m;
    }),
    Namespace: 'Ext/AWS/ECS'
  };

  cb(null, metricData);
};

const getServiceByDeploymentId = (ecs, eventInfo, serviceDeploymentId, cb) => {
  let token   = null;
  let service = null;

  async.doUntil(
    (cb) => async.seq(
      (t, cb) => ecs.listServices({cluster: eventInfo.cluster, nextToken: t},
        cb),
      (response, cb) => ecs.describeServices({
        cluster: eventInfo.cluster,
        services: response.serviceArns
      }, (err, data) => {
        if (err) {
          return cb(err);
        }

        cb(null, [response.nextToken, data.services]);
      })
    )(token, cb),
    (data) => {
      service = _.find(
        data[1],
        (s) => _.map(s.deployments, 'id').indexOf(serviceDeploymentId) >= 0
      );

      return service || !(token = data[0]);
    },
    (err) => {
      if (err) {
        return cb(err);
      }

      if (!service) {
        return cb(
          new Error(`Cant't find service with deployment id ${serviceDeploymentId} from ${JSON.stringify(
            eventInfo)}`));
      }

      cb(null, service)
    }
  );
};

const getServiceDescription = (ecs, eventInfo, cb) => {
  async.waterfall([
    (cb) => {
      ecs.describeTasks({
        cluster: eventInfo.cluster,
        tasks: [eventInfo.task]

      }, cb)
    },
    (data, cb) => cb(null, _.get(data, 'tasks.0.startedBy')),
    (serviceId, cb) => getServiceByDeploymentId(ecs, eventInfo, serviceId, cb),
    (service, cb) => cb(null, _.omit(service, 'events', 'deployments'))
  ], cb);
};

const getTasksForService = (ecs, eventInfo, service, cb) => {
  let token = null;
  let tasks = [];

  async.doUntil(
    (cb) => async.seq(
      (t, cb) => ecs.listTasks(
        {cluster: eventInfo.cluster, family: service.serviceName, nextToken: t},
        cb),
      (response, cb) => {
        if (0 === response.taskArns.length) {
          return cb(null, [response.nextToken, []]);
        }

        ecs.describeTasks({
            cluster: eventInfo.cluster,
            tasks: response.taskArns
          }, (err, data) => cb(err, [response.nextToken, data.tasks])
        )
      }
    )(token, cb),
    (data) => {
      tasks = tasks.concat(data[1]);
      return !(token = data[0]);
    },
    (err) => {
      cb(err, tasks);
    }
  );
};

module.exports = (event, cb) => {
  const ecs  = new AWS.ECS();
  const info = common.extractInfo(event);

  async.auto(
    {
      service: (cb) => getServiceDescription(ecs, info, cb),
      tasks: ['service',
        (results, cb) => getTasksForService(ecs, info, results.service, cb)],
      metrics: ['service', 'tasks',
        (results, cb) => extractMetricsWithDebug(event, info, results.service,
          results.tasks, cb)],
    },
    (err, results) => cb(err, results.metrics)
  );
};

module.exports.extractMetrics        = extractMetrics;
module.exports.getServiceDescription = getServiceDescription;
module.exports.getTasksForService    = getTasksForService;
