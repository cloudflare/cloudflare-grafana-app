import {metricList, dimensionList, unitList, dimensionValues} from './metric_def';
import _ from 'lodash';
import TableModel from 'app/core/table_model';
import './cfapi';

class CloudflareDatasource {

  constructor(instanceSettings, templateSrv, proxySrv)  {
    this.instanceSettings = instanceSettings;
    this.name = instanceSettings.name;
    this.templateSrv = templateSrv;
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
      filters: filters
    };

    /* Resolve tag, and fetch data */
    return this.api.fetchTag(query).then(tag => {
      return this.api.fetchData(query).then(response => {
        return this.processResponse(query, options, response);
      });
    });
  }

  processResponse(query, options, resp) {
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
        let grafana_series = {
          target: seriesName,
          datapoints: series.map((point, i) => {
            let ts = result.time_intervals[i].map(Date.parse)
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
    var table = new TableModel();
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