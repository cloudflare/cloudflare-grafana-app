'use strict';

System.register(['./metric_def', 'angular', 'lodash', 'moment'], function (_export, _context) {
  "use strict";

  var metricList, dimensionList, angular, _, moment, _createClass, CloudflareProxy;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  // Get UTC timestamp
  function getUTCTimestamp() {
    var ts = new Date();
    return ts.getTime() + ts.getTimezoneOffset() * 60 * 1000;
  }

  // Get hash of the query
  function getHash(queryObj) {
    var query = _.cloneDeep(queryObj);
    query.since = null;
    query.until = null;
    return JSON.stringify(query);
  }

  // Prevent too frequent queries
  function getMaxRefreshInterval(query) {
    var interval = Date.parse(query.until) - Date.parse(query.since);
    if (interval > moment.duration(1, 'months')) {
      return 60 * 60 * 1000; // 1 hour
    } else if (interval > moment.duration(1, 'day')) {
      return 15 * 60 * 1000; // 15 min
    } else {
      return 5 * 60 * 1000; // 5 min
    }
  }

  return {
    setters: [function (_metric_def) {
      metricList = _metric_def.metricList;
      dimensionList = _metric_def.dimensionList;
    }, function (_angular) {
      angular = _angular.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_moment) {
      moment = _moment.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      CloudflareProxy = function () {
        function CloudflareProxy(backendSrv) {
          _classCallCheck(this, CloudflareProxy);

          this.backendSrv = backendSrv;
          this.baseUrl = 'api/plugin-proxy/cloudflare-app';
          this.tags = {};
          this.cache = {};
          this.cacheUpdateInterval = 5 * 60 * 1000; // 5 min by default
          this.requestCachingIntervals = {
            '1d': 0
          };
        }

        _createClass(CloudflareProxy, [{
          key: 'fetchConfig',
          value: function fetchConfig() {
            var _this = this;

            if (this.config) {
              return Promise.resolve(this.config);
            }
            var self = this;
            /* Resolve organizations for this datasource */
            return this.backendSrv.get('api/plugins/cloudflare-app/settings').then(function (resp) {
              _this.config = resp.jsonData;
              return _this.config;
            }, function () {
              _this.config = {};
              return _this.config;
            });
          }
        }, {
          key: 'fetchData',
          value: function fetchData(query) {
            var _this2 = this;

            var cached_query = _.cloneDeep(query);
            var hash = getHash(cached_query);

            if (this.notCached(query)) {
              return this.api(query).then(function (result) {
                var timestamp = getUTCTimestamp();
                _this2.cache[hash] = {
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
        }, {
          key: 'notCached',
          value: function notCached(query) {
            var hash = getHash(query);
            var timestamp = getUTCTimestamp();
            var since = Date.parse(query.since);
            var until = Date.parse(query.until);
            var query_range = until - since;
            var cache_since = this.cache[hash] ? Date.parse(this.cache[hash].query.since) : null;
            var cache_until = this.cache[hash] ? Date.parse(this.cache[hash].query.until) : null;
            var cached_query_range = cache_until - cache_since;
            var max_refresh_interval = getMaxRefreshInterval(query);

            return !this.cache[hash] || timestamp - until > max_refresh_interval || this.cache[hash] && (timestamp - cache_until > max_refresh_interval || since < cache_since || Math.abs(query_range - cached_query_range) > 60 * 1000 // is time range changed?
            );
          }
        }, {
          key: 'fetchTag',
          value: function fetchTag(query) {
            var _this3 = this;

            /* Break tag and scope */
            var scope = query.tag.split('/', 2);
            var tag = scope[0];
            scope = scope[1];
            /* Resolve tag if symbolic */
            var tagRegex = /[a-z0-9]{32}/g;
            if (tag.match(tagRegex)) {
              return Promise.resolve(query.tag);
            }
            /* Check tag cache */
            var key = '#' + query.from + ':' + query.tag;
            var cached = this.tags[key];
            if (cached) {
              query.tag = cached;
              return Promise.resolve(cached);
            }
            var path = 'zones';
            if (query.from == 'vdns') {
              path = 'user/virtual_dns';
              if (scope) {
                path = 'organizations/' + scope + '/virtual_dns';
              }
            }
            /* Resolve the tag name to ID */
            return this._get('/api/v4/' + path, { name: tag }).then(function (resp) {
              var data = resp.data;
              if (!data || !data.success) {
                return '';
              }
              data.result.forEach(function (e) {
                if (e.name == tag) {
                  var id = e.id;
                  if (scope) {
                    id = id + '/' + scope;
                  }
                  _this3.tags[key] = id;
                  /* Replace query tag and return */
                  query.tag = id;
                  return id;
                }
              });
            });
          }
        }, {
          key: 'fetchOrganizations',
          value: function fetchOrganizations() {
            var _this4 = this;

            return this.fetchConfig().then(function () {
              if (!_this4.config.organizations) {
                return [];
              }
              return _this4.config.organizations;
            });
          }
        }, {
          key: 'fetchZones',
          value: function fetchZones() {
            /* Default parameters */
            var params = {
              status: 'active',
              per_page: 50
            };
            /* Get list of zones */
            return this._get('/api/v4/zones', params).then(function (resp) {
              var data = resp['data'];
              if (!data || !data.success) {
                return [];
              }
              /* Gather list of active zones */
              var zones = [];
              data.result.forEach(function (e) {
                zones.push({ text: e.name, value: e.id });
              });
              return zones;
            });
          }
        }, {
          key: 'fetchClusters',
          value: function fetchClusters() {
            var _this5 = this;

            return this.fetchConfig().then(function () {
              if (!_this5.config.clusters) {
                return [];
              }
              return _this5.config.clusters.map(function (e) {
                /* Glue organisation id to cluster id
                 * so that metric fetching knows whether to call
                 * organizations or user endpoint */
                var id = e.id;
                if (e.organization) {
                  id = id + '/' + e.organization;
                }
                return { text: e.name, value: id };
              });
            });
          }
        }, {
          key: 'formatQuery',
          value: function formatQuery(options) {
            var query = {
              "metrics": options.metrics.join(','),
              "since": options.range.from.utc().toISOString().split('.')[0] + 'Z',
              "until": options.range.to.utc().toISOString().split('.')[0] + 'Z',
              "filters": this.formatFilters(options.filters)
            };
            if (options.dimensions) {
              query.dimensions = options.dimensions;
            }

            return query;
          }
        }, {
          key: 'formatFilters',
          value: function formatFilters(filters) {
            var out = [];
            filters.forEach(function (e, i) {
              var op = e.operator;
              /* Convert equality operator */
              if (op == '=') {
                op = '==';
              }
              out.push(e.key + op + e.value);
              /* Add condition if chaining */
              var cond = e.condition || 'AND';
              if (i < filters.length - 1) {
                out.push(cond);
              }
            });
            return out.join(' ');
          }
        }, {
          key: 'api',
          value: function api(query) {
            var endpoint = '/dns_analytics/report';
            if (query.bytime) {
              endpoint = endpoint + '/bytime';
            }
            var params = this.formatQuery(query);
            var scope = query.tag.split('/', 2);
            var tag = scope[0];
            scope = scope[1];
            /* Add organization endpoint prefix */
            if (scope) {
              scope = '/api/v4/organizations/' + scope;
            }
            /* Select either zone or cluster */
            if (query.from == 'vdns') {
              if (!scope) {
                scope = '/api/v4/user';
              }
              return this._get(scope + '/virtual_dns/' + tag + endpoint, params);
            }
            if (!scope) {
              scope = '/api/v4/zones';
            }
            return this._get(scope + '/' + tag + endpoint, params);
          }
        }, {
          key: '_get',
          value: function _get(url, data) {
            console.log();
            return this.backendSrv.datasourceRequest({
              method: 'GET',
              url: this.baseUrl + url,
              params: data
            });
          }
        }]);

        return CloudflareProxy;
      }();

      angular.module('grafana.services').service('proxySrv', CloudflareProxy);
    }
  };
});
//# sourceMappingURL=cfapi.js.map
