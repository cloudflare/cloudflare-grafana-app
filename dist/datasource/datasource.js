'use strict';

System.register(['./metric_def', 'lodash', 'app/core/table_model', './cfapi'], function (_export, _context) {
  "use strict";

  var metricList, dimensionList, unitList, dimensionValues, _, TableModel, _createClass, CloudflareDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_metric_def) {
      metricList = _metric_def.metricList;
      dimensionList = _metric_def.dimensionList;
      unitList = _metric_def.unitList;
      dimensionValues = _metric_def.dimensionValues;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreTable_model) {
      TableModel = _appCoreTable_model.default;
    }, function (_cfapi) {}],
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

      _export('CloudflareDatasource', CloudflareDatasource = function () {
        function CloudflareDatasource(instanceSettings, templateSrv, dashboardSrv, proxySrv) {
          _classCallCheck(this, CloudflareDatasource);

          this.instanceSettings = instanceSettings;
          this.name = instanceSettings.name;
          this.templateSrv = templateSrv;
          this.dashboardSrv = dashboardSrv;
          this.api = proxySrv;
        }

        _createClass(CloudflareDatasource, [{
          key: 'joinField',
          value: function joinField(value, variable) {
            if (!variable.multi && !variable.includeAll) {
              return value;
            }
            if (typeof value === 'string') {
              return value;
            }
            return value.join(',');
          }
        }, {
          key: 'query',
          value: function query(options) {
            var _this = this;

            if (!options.targets || options.targets.length === 0) {
              return Promise.resolve({ data: [] });
            }

            /* Do not run queries if there's not metric selected */
            var target = options.targets[0];
            if (!target.metrics || target.metrics.length === 0) {
              return Promise.resolve({ data: [] });
            }

            /* Build out ad-hoc filters and do templating. */
            var filters = this.templateSrv.getAdhocFilters(this.name);
            var tag = this.templateSrv.replace(target.tag, options.scopedVars, this.joinField.bind(this));
            if (!tag) {
              return Promise.resolve({ data: [] });
            }

            /* Combine filters */
            filters = _.union(filters, target.filters);

            /* Run the query and process response */
            var query = {
              range: {
                from: options.range.from,
                to: options.range.to
              },
              tag: tag,
              from: target.from || 'zone',
              metrics: target.metrics,
              dimensions: target.dimensions,
              filters: filters,
              bytime: true
            };

            var panel = this.dashboardSrv.dash.getPanelInfoById(options.panelId);
            if (panel) {
              query.bytime = panel.panel.type != 'table';
            }

            /* Resolve tag, and fetch data */
            return this.api.fetchTag(query).then(function (tag) {
              return _this.api.fetchData(query).then(function (response) {
                return _this.processResponse(query, options, response);
              });
            });
          }
        }, {
          key: 'processResponse',
          value: function processResponse(query, options, resp, bytime) {
            /* Check whether the API response is OK and well formed. */
            var data = resp['data'];
            if (!data) {
              return Promise.reject({ message: 'No data in the API response.' });
            }
            if (data.errors.length > 0) {
              return Promise.reject({ message: data.errors.join(' ') });
            }

            var result = data.result;
            if (result.rows === 0) {
              return [];
            }

            /* Check whether the result is a time series or table */
            if (!result.time_intervals) {
              return this.processTableData(result);
            } else {
              return this.processTimeSeries(result);
            }
          }
        }, {
          key: 'processTimeSeries',
          value: function processTimeSeries(result) {
            var seriesList = [];
            var data = result.data;
            var intervals = result.time_intervals.map(function (ts) {
              return ts.map(Date.parse);
            });
            data.forEach(function (group) {
              group.metrics.forEach(function (series, m) {
                /* Generate time series for each metric */
                var seriesName = result.query.metrics[m];
                /* Get time unit for metric */
                var unit = unitList[seriesName];
                /* Add dimension value if present */
                if (group.dimensions) {
                  var dimensions = group.dimensions.join(",");
                  if (dimensions == "") {
                    return;
                  }
                  seriesName += ", " + dimensions;
                }
                /* Truncate series to time interval length and vice versa */
                series.length = Math.min(series.length, intervals.length);
                /* Format the time series */
                var grafana_series = {
                  target: seriesName,
                  datapoints: series.map(function (point, i) {
                    var ts = intervals[i];
                    if (unit) {
                      point = unit.transform(point, ts[0], ts[1]);
                    }
                    return [point, ts[1]];
                  })
                };
                seriesList.push(grafana_series);
              });
            });

            return { data: seriesList };
          }
        }, {
          key: 'processTableData',
          value: function processTableData(result) {
            var table = new TableModel();
            /* Create table columns */
            result.query.dimensions.forEach(function (e) {
              table.columns.push({ text: e });
            });
            result.query.metrics.forEach(function (e) {
              table.columns.push({ text: e });
            });
            /* Add rows */
            result.data.forEach(function (group) {
              var row = [];
              group.dimensions.forEach(function (e) {
                row.push(e);
              });
              group.metrics.forEach(function (e) {
                row.push(e);
              });
              table.rows.push(row);
            });
            return { data: [table] };
          }
        }, {
          key: 'metricFindQuery',
          value: function metricFindQuery(query) {
            if (query === 'metrics()') {
              return Promise.resolve(metricList);
            }
            if (query === 'dimensions()') {
              return Promise.resolve(dimensionList);
            }
            if (query === 'clusters()') {
              return this.api.fetchClusters();
            }
            if (query === 'organizations()') {
              return this.api.fetchOrganizations();
            }
            return this.api.fetchZones();
          }
        }, {
          key: 'getTagKeys',
          value: function getTagKeys() {
            return Promise.resolve(dimensionList.map(function (e) {
              return { text: e.value };
            }));
          }
        }, {
          key: 'getTagValues',
          value: function getTagValues(options) {
            var keys = dimensionValues[options.key] || [];
            return Promise.resolve(keys.map(function (e) {
              return { text: e };
            }));
          }
        }]);

        return CloudflareDatasource;
      }());

      _export('CloudflareDatasource', CloudflareDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
