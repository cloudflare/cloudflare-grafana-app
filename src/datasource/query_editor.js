import {QueryCtrl} from 'app/plugins/sdk';
import {metricList, dimensionList} from './metric_def';

class CloudflareQueryCtrl extends QueryCtrl {

  constructor($scope, uiSegmentSrv, $q, $injector) {
    super($scope, $injector);
    this.$q = $q;
    this.uiSegmentSrv = uiSegmentSrv;
    this.dimensions = dimensionList.slice();
    this.dimensions.push({text: '', value: ''});
    this.metrics = metricList;
    this.queryModes = [
      {value: 'zone', text: 'Zone'},
      {value: 'vdns', text: 'Virtual DNS'}
    ];
    

    this.target.from = this.target.from || 'zone';
    if (!this.target.metrics) {
      this.target.metrics = ['queryCount'];
    }

    if (!this.target.filters) {
      this.target.filters = [];
    }

    this.removeTagFilterSegment = uiSegmentSrv.newSegment({fake: true, value: '-- remove filter --'});
    this.buildSegmentModel()
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

  /*
   * This is adapted from AdHocFiltersCtrl
   * Source: https://github.com/grafana/grafana/blob/master/public/app/features/dashboard/ad_hoc_filters.ts
   */
  buildSegmentModel() {
    this.segments = [];

    for (let tag of this.target.filters) {
      if (this.segments.length > 0) {
        this.segments.push(this.uiSegmentSrv.newCondition('AND'));
      }

      if (tag.key !== undefined && tag.value !== undefined) {
        this.segments.push(this.uiSegmentSrv.newKey(tag.key));
        this.segments.push(this.uiSegmentSrv.newOperator(tag.operator));
        this.segments.push(this.uiSegmentSrv.newKeyValue(tag.value));
      }
    }

    this.segments.push(this.uiSegmentSrv.newPlusButton());
  }

  getOptions(segment, index) {
    if (segment.type === 'operator') {
      return this.$q.when(this.uiSegmentSrv.newOperators(['=', '!=', '<', '>', '=~', '!~']));
    }

    if (segment.type === 'condition') {
      return this.$q.when([this.uiSegmentSrv.newSegment('AND')]);
    }

    let ds = this.datasource;
    var options = {};
    var promise = null;

    if (segment.type !== 'value') {
      promise = ds.getTagKeys();
    } else {
      options.key = this.segments[index-2].value;
      promise = ds.getTagValues(options);
    }

    return promise.then(results => {
      results = _.map(results, segment => {
        return this.uiSegmentSrv.newSegment({value: segment.text});
      });

      // add remove option for keys
      if (segment.type === 'key') {
        results.splice(0, 0, angular.copy(this.removeTagFilterSegment));
      }
      return results;
    });
  }

  segmentChanged(segment, index) {
    this.segments[index] = segment;

    // handle remove tag condition
    if (segment.value === this.removeTagFilterSegment.value) {
      this.segments.splice(index, 3);
      if (this.segments.length === 0) {
        this.segments.push(this.uiSegmentSrv.newPlusButton());
      } else if (this.segments.length > 2) {
        this.segments.splice(Math.max(index-1, 0), 1);
        if (this.segments[this.segments.length-1].type !== 'plus-button') {
          this.segments.push(this.uiSegmentSrv.newPlusButton());
        }
      }
    } else {
      if (segment.type === 'plus-button') {
        if (index > 2) {
          this.segments.splice(index, 0, this.uiSegmentSrv.newCondition('AND'));
        }
        this.segments.push(this.uiSegmentSrv.newOperator('='));
        this.segments.push(this.uiSegmentSrv.newFake('select tag value', 'value', 'query-segment-value'));
        segment.type = 'key';
        segment.cssClass = 'query-segment-key';
      }

      if ((index+1) === this.segments.length) {
        this.segments.push(this.uiSegmentSrv.newPlusButton());
      }
    }

    this.updateVariableModel();
  }

  updateVariableModel() {
    let filters = [];
    let filterIndex = -1;
    let hasFakes = false;
    this.segments.forEach(segment => {
      if (segment.type === 'value' && segment.fake) {
        hasFakes = true;
        return;
      }
      switch (segment.type) {
        case 'key': {
          filters.push({key: segment.value});
          filterIndex += 1;
          break;
        }
        case 'value': {
          filters[filterIndex].value = segment.value;
          break;
        }
        case 'operator': {
          filters[filterIndex].operator = segment.value;
          break;
        }
        case 'condition': {
          filters[filterIndex].condition = segment.value;
          break;
        }
      }
    });

    if (!hasFakes) {
      this.target.filters = filters;
      this.targetBlur();
    }
  }
}

CloudflareQueryCtrl.templateUrl = 'datasource/query_editor.html';

export {CloudflareQueryCtrl};