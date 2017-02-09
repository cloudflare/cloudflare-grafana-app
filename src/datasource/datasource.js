import {metricList, dimensionList, unitList, dimensionValues} from './metric_def';
import _ from 'lodash';
import TableModel from 'app/core/table_model';
import './cfapi';

class CloudflareDatasource {

  constructor(instanceSettings, templateSrv, dashboardSrv, proxySrv)  {
    this.instanceSettings = instanceSettings;
    this.name = instanceSettings.name;
    this.templateSrv = templateSrv;
    this.dashboardSrv = dashboardSrv;
    this.api = proxySrv;
  }

  joinField(value, variable) {
    if (!variable.multi && !variable.includeAll) {
      return value;
    }
    if (typeof value === 'string') {
      return value;
    }
    return value.join(',');
  }

  query(options) {
    if (!options.targets || options.targets.length === 0) {
      return Promise.resolve({data: []});
    }

    /* Do not run queries if there's not metric selected */
    let target = options.targets[0];
    if (!target.metrics || target.metrics.length === 0) {
      return Promise.resolve({data: []});
    }

    /* Build out ad-hoc filters and do templating. */
    let filters = this.templateSrv.getAdhocFilters(this.name);
    let tag = this.templateSrv.replace(target.tag, options.scopedVars, this.joinField.bind(this));
    if (!tag) {
      return Promise.resolve({data: []});
    }

    /* Combine filters */
    filters = _.union(filters, target.filters);

    /* Run the query and process response */
    let query = {
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

    let panel = this.dashboardSrv.dash.getPanelInfoById(options.panelId);
    if (panel) {
      query.bytime = (panel.panel.type != 'table');
    }

    /* Resolve tag, and fetch data */
    return this.api.fetchTag(query).then(tag => {
      return this.api.fetchData(query).then(response => {
        return this.processResponse(query, options, response);
      });
    });
  }

  processResponse(query, options, resp, bytime) {
    /* Check whether the API response is OK and well formed. */
    let data = resp['data'];
    if (!data) {
      return Promise.reject({message: 'No data in the API response.'});
    }
    if (data.errors.length > 0) {
      return Promise.reject({message: data.errors.join(' ')});
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

  processTimeSeries(result) {
    let seriesList = [];
    let data = result.data;
    let intervals = result.time_intervals.map(ts => {
      return ts.map(Date.parse);
    });
    data.forEach(group => {
      group.metrics.forEach((series, m) => {
        /* Generate time series for each metric */
        let seriesName = result.query.metrics[m]
        /* Get time unit for metric */
        let unit = unitList[seriesName];
        /* Add dimension value if present */
        if (group.dimensions) {
          let dimensions = group.dimensions.join(",")
          if (dimensions == "") {
            return;
          }
          seriesName += ", " + dimensions;
        }
        /* Truncate series to time interval length and vice versa */
        series.length = Math.min(series.length, intervals.length);
        /* Format the time series */
        let grafana_series = {
          target: seriesName,
          datapoints: series.map((point, i) => {
            let ts = intervals[i];
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

  processTableData(result) {
    let table = new TableModel();
    /* Create table columns */
    result.query.dimensions.forEach(e => {
      table.columns.push({text: e});
    });
    result.query.metrics.forEach(e => {
      table.columns.push({text: e});
    });
    /* Add rows */
    result.data.forEach(group => {
      let row = [];
      group.dimensions.forEach(e => {
        row.push(e)
      });
      group.metrics.forEach(e => {
        row.push(e)
      });
      table.rows.push(row);
    });
    return {data: [table]};
  }

  metricFindQuery(query) {
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

  getTagKeys() {
    return Promise.resolve(dimensionList.map(e => {
      return {text: e.value};
    }));
  }

  getTagValues(options) {
    let keys = dimensionValues[options.key] || [];
    return Promise.resolve(keys.map(e => {
      return {text: e};
    }));
  }
}

export {CloudflareDatasource};