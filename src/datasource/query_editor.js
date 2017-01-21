import {QueryCtrl} from 'app/plugins/sdk';
import {metricList, dimensionList} from './metric_def';

class CloudflareQueryCtrl extends QueryCtrl {

  constructor($scope, $injector) {
    super($scope, $injector);

    this.dimensions = dimensionList;
    this.metrics = metricList;
    this.target.from = this.target.mode || 'zone';
    this.queryModes = [
      {value: 'zone', text: 'Zone'},
      {value: 'vdns', text: 'Virtual DNS'}
    ];
    if (!this.target.metrics) {
      this.target.metrics = ['queryCount'];
    }
  }

  addMetric() {
    if (!this.addMetricMode) {
      this.addMetricMode = true;
      return;
    }

    if (!this.target.metrics) {
      this.target.metrics = [];
    }

    let key = this.target.currentMetricKey;
    this.target.currentMetricKey = '';

    /* Sort out duplicates */
    if (this.target.metrics.indexOf(key) < 0) {
      this.target.metrics.push(key)
    }

    this.target.currentMetricKey = '';
    this.addMetricMode = false;
    this.targetBlur();
  }

  removeMetric(key) {
    var index = this.target.metrics.indexOf(key);
    if (index > -1) {
        this.target.metrics.splice(index, 1);
    }
    this.targetBlur();
  }

  closeAddMetricMode() {
    this.addMetricMode = false;
  }

  targetBlur() {
    this.refresh();
  }
}

CloudflareQueryCtrl.templateUrl = 'datasource/query_editor.html';

export {CloudflareQueryCtrl};