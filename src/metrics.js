const config = require('./config');
const os = require('os');

const requests = {};
let activeUsers = 0;
const authentication = {};
let totalPizzas = 0;
let totalRevenue = 0;
let totalPizzaFailures = 0;
let serviceLatency = 0;
let pizzaCreationLatency = 0;

function getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return cpuUsage.toFixed(2) * 100;

}
      
function getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory);
        return memoryUsage.toFixed(2) * 100;
}

function resetMetrics(){
        activeUsers = 0;
        totalPizzas = 0;
        totalRevenue = 0;
        totalPizzaFailures = 0;
        serviceLatency = 0;
        pizzaCreationLatency = 0;
}

function incrementActiveUsers() {
        activeUsers++;
}

function decrementActiveUsers() {
        activeUsers--;
}

function addPizza() {
        totalPizzas++;
}

function addRevenue(amount) {
        totalRevenue += amount;
}

function addPizzaFailure() {
        totalPizzaFailures++;   
}

function trackHttpRequests() {
        return (req, res, next) => {
                requests[req.method] = (requests[req.method] || 0) + 1;
                requests['total'] = (requests['total'] || 0) + 1;
                next();
        };
}

function updateServiceLatency(latency) {
        serviceLatency = latency;
} 

function updatePizzaCreationLatency(latency) {
        pizzaCreationLatency = latency;
}

//status is either success or failure
function trackAuthenticationAttempts(status) {
        authentication[status] = (authentication[status] || 0) + 1; 
}

// This will periodically send metrics to Grafana
setInterval(() => {

        Object.keys(requests).forEach((endpoint) => {
                sendMetricToGrafana('requests', requests[endpoint], { endpoint });
        });

        sendMetricToGrafana('activeUsers', activeUsers);
        sendMetricToGrafana('totalPizzas', totalPizzas);
        sendMetricToGrafana('totalRevenue', totalRevenue.toFixed(2) * 100);
        sendMetricToGrafana('totalPizzaFailures', totalPizzaFailures);
        sendMetricToGrafana('serviceLatency', serviceLatency.toFixed(2) * 100);
        sendMetricToGrafana('pizzaCreationLatency', pizzaCreationLatency.toFixed(2) * 100);

        Object.keys(authentication).forEach((status) => {
                sendMetricToGrafana('authentication', authentication[status], { status });
        });
        
        sendMetricToGrafana('cpuPercentage', getCpuUsagePercentage());
        sendMetricToGrafana('memoryPercentage', getMemoryUsagePercentage());
}, 5000);

function sendMetricToGrafana(metricName, metricValue, attributes) {
  attributes = { ...attributes, source: config.metrics.source };

  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: '1',
                sum: {
                  dataPoints: [
                    {
                      asInt: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                      attributes: [],
                    },
                  ],
                  aggregationTemporality: 'AGGREGATION_TEMPORALITY_CUMULATIVE',
                  isMonotonic: true,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  Object.keys(attributes).forEach((key) => {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0].sum.dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  fetch(`${config.metrics.url}`, {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { Authorization: `Bearer ${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Failed to push metrics data to Grafana');
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });

}

module.exports = { incrementActiveUsers, decrementActiveUsers, trackHttpRequests, trackAuthenticationAttempts, addPizza, addPizzaFailure, addRevenue, updateServiceLatency, updatePizzaCreationLatency };