import {metricList, dimensionList} from './metric_def';

import angular from 'angular';
import _ from 'lodash';
import moment from 'moment';

// Get UTC timestamp
function getUTCTimestamp() {
  let ts = new Date();
  return ts.getTime() + ts.getTimezoneOffset() * 60 * 1000;
}

// Get hash of the query
function getHash(queryObj) {
  let query = _.cloneDeep(queryObj);
  query.since = null;
  query.until = null;
  return JSON.stringify(query);
}

// Prevent too frequent queries
function getMaxRefreshInterval(query) {
  let interval = Date.parse(query.until) - Date.parse(query.since);
  if (interval > moment.duration(1, 'months')) {
    return 60 * 60 * 1000; // 1 hour
  } else if (interval > moment.duration(1, 'day')) {
    return 15 * 60 * 1000; // 15 min
  } else {
    return 5 * 60 * 1000; // 5 min
  }
}

class CloudflareProxy {
  constructor(backendSrv) {
  	this.backendSrv = backendSrv;
  	this.baseUrl = 'api/plugin-proxy/cloudflare-app';
    this.cache = {};
    this.cacheUpdateInterval = 5 * 60 * 1000; // 5 min by default
    this.requestCachingIntervals = {
      '1d': 0
    };
  }

  invokeQuery(query) {
    let cached_query = _.cloneDeep(query);
    let hash = getHash(cached_query);

    if (this.shouldInvoke(query)) {
      return this.invokeAPI(query).then(result => {
        let timestamp = getUTCTimestamp();
        this.cache[hash] = {
          timestamp: timestamp,
          query: cached_query,
          result: result
        };
        return result;
      });
    } else {
      return Promise.resolve(this.cache[hash].result);
    }
  }

  shouldInvoke(query) {
    let hash = getHash(query);
    let timestamp = getUTCTimestamp();

    let since = Date.parse(query.since);
    let until = Date.parse(query.until);
    let query_range = until - since;

    let cache_since = this.cache[hash] ? Date.parse(this.cache[hash].query.since) : null;
    let cache_until = this.cache[hash] ? Date.parse(this.cache[hash].query.until) : null;
    let cached_query_range = cache_until - cache_since;

    let max_refresh_interval = getMaxRefreshInterval(query);

    return (
      !this.cache[hash] ||
      timestamp - until > max_refresh_interval ||
      (this.cache[hash] && (
        timestamp - cache_until > max_refresh_interval ||
        since < cache_since ||
        Math.abs(query_range - cached_query_range) > 60 * 1000 // is time range changed?
      ))
    );
  }

  getZones() {
    return this._get('/api/v4/zones').then(response => {
      let data = response.data;
      if (!data || !data.success) {
      	return []
      }
      /* Gather list of active zones */
      let zones = [];
      data.result.forEach(e => {
      	if (e.status == "active") {
      		zones.push({text: e.name, value: e.id});	
      	}
      });
      return zones;
    });
  }

  getClusters() {
    return this._get('/api/v4/user/virtual_dns').then(response => {
      let data = response.data;
      if (!data || !data.success) {
        return []
      }
      let clusters = [];
      data.result.forEach(e => {
        clusters.push({text: e.name, value: e.id});  
      });
      return clusters;
    });
  }

  formatQuery(options) {
    let query = {
      "metrics": options.metrics.join(','),
      "since": options.range.from.utc().toISOString().split('.')[0]+'Z',
      "until": options.range.to.utc().toISOString().split('.')[0]+'Z',
      "filters": this.formatFilters(options.filters)
    };
    if (options.dimensions) {
      query.dimensions = options.dimensions;
    }

    return query;
  }

  formatFilters(filters) {
    return '';
  }

  invokeAPI(query) {
    let params = this.formatQuery(query)
    if (query.from == 'vdns') {
      return this._get('/usr/virtual-dns/'+query.tag+'/dns-analytics/report/bytime', params);
    }
    return this._get('/zones/'+query.tag+'/dns-analytics/report/bytime', params);
  }

  _get(url, data) {
    return this.backendSrv.datasourceRequest({
      method: 'GET',
      url: this.baseUrl + url,
      params: data
    });
  }
}

angular
  .module('grafana.services')
  .service('proxySrv', CloudflareProxy);