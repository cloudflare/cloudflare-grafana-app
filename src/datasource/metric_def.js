var metricList = [
  {text: 'Query count', value: 'queryCount' },
  {text: 'Average response time', value: 'responseTimeAvg' },
  {text: 'Median response time', value: 'responseTimeMedian' },
  {text: '90th percentile response time', value: 'responseTime90th' },
  {text: '99th percentile response time', value: 'responseTime99th' }
];

var dimensionList = [
  {text: 'Query Name',      value: 'queryName'},
  {text: 'Query Type',      value: 'queryType'},
  {text: 'Response Code',   value: 'responseCode'},
  {text: 'Response Cached', value: 'responseCached'},
  {text: 'Colo Name',       value: 'coloName'},
  {text: 'Origin NS',       value: 'origin'}
];

var unitList = {
  queryCount: {
    transform: function (p, from, to) {
      return p / ((to - from) / 1000 + 1); /* Convert to seconds */
    }
  }
}

export {metricList, dimensionList, unitList};
