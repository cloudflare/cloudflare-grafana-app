import {metricList, dimensionList, unitList} from './metric_def';
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
    return this.api.invokeQuery(query).then(
      this.processResponse.bind(this, query, options)
    );
  }

  processResponse(query, options, resp) {
    /* Check whether the API response is OK and well formed. */
    if (!resp.data) {
      return Promise.reject({message: 'No data in the API response.'});
    }
    if (resp.data.errors.length > 0) {
      return Promise.reject({message: resp.data.errors.join(' ')});
    }

    var result = resp.data.result;
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
          seriesName += ", " + group.dimensions.join(",")
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
      return this.api.getClusters();
    }

    return this.api.getZones();
  }

  getTagKeys() {
    return Promise.resolve(dimensionList);
  }

  getTagValues(options) {
    return Promise.resolve([]);
  }
}

export {CloudflareDatasource};