'use strict';

System.register(['app/plugins/sdk', './metric_def'], function (_export, _context) {
  "use strict";

  var QueryCtrl, metricList, dimensionList, _createClass, CloudflareQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }, function (_metric_def) {
      metricList = _metric_def.metricList;
      dimensionList = _metric_def.dimensionList;
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

      _export('CloudflareQueryCtrl', CloudflareQueryCtrl = function (_QueryCtrl) {
        _inherits(CloudflareQueryCtrl, _QueryCtrl);

        function CloudflareQueryCtrl($scope, uiSegmentSrv, $q, $injector) {
          _classCallCheck(this, CloudflareQueryCtrl);

          var _this = _possibleConstructorReturn(this, (CloudflareQueryCtrl.__proto__ || Object.getPrototypeOf(CloudflareQueryCtrl)).call(this, $scope, $injector));

          _this.$q = $q;
          _this.uiSegmentSrv = uiSegmentSrv;
          _this.dimensions = dimensionList.slice();
          _this.dimensions.push({ text: '', value: '' });
          _this.metrics = metricList;
          _this.queryModes = [{ value: 'zone', text: 'Zone' }, { value: 'vdns', text: 'Virtual DNS' }];

          _this.target.from = _this.target.from || 'zone';
          if (!_this.target.metrics) {
            _this.target.metrics = ['queryCount'];
          }

          if (!_this.target.filters) {
            _this.target.filters = [];
          }

          _this.removeTagFilterSegment = uiSegmentSrv.newSegment({ fake: true, value: '-- remove filter --' });
          _this.buildSegmentModel();
          return _this;
        }

        _createClass(CloudflareQueryCtrl, [{
          key: 'addMetric',
          value: function addMetric() {
            if (!this.addMetricMode) {
              this.addMetricMode = true;
              return;
            }

            if (!this.target.metrics) {
              this.target.metrics = [];
            }

            var key = this.target.currentMetricKey;
            this.target.currentMetricKey = '';

            /* Sort out duplicates */
            if (this.target.metrics.indexOf(key) < 0) {
              this.target.metrics.push(key);
            }

            this.target.currentMetricKey = '';
            this.addMetricMode = false;
            this.targetBlur();
          }
        }, {
          key: 'removeMetric',
          value: function removeMetric(key) {
            var index = this.target.metrics.indexOf(key);
            if (index > -1) {
              this.target.metrics.splice(index, 1);
            }
            this.targetBlur();
          }
        }, {
          key: 'closeAddMetricMode',
          value: function closeAddMetricMode() {
            this.addMetricMode = false;
          }
        }, {
          key: 'targetBlur',
          value: function targetBlur() {
            this.refresh();
          }
        }, {
          key: 'buildSegmentModel',
          value: function buildSegmentModel() {
            this.segments = [];

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = this.target.filters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var tag = _step.value;

                if (this.segments.length > 0) {
                  this.segments.push(this.uiSegmentSrv.newCondition('AND'));
                }

                if (tag.key !== undefined && tag.value !== undefined) {
                  this.segments.push(this.uiSegmentSrv.newKey(tag.key));
                  this.segments.push(this.uiSegmentSrv.newOperator(tag.operator));
                  this.segments.push(this.uiSegmentSrv.newKeyValue(tag.value));
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            this.segments.push(this.uiSegmentSrv.newPlusButton());
          }
        }, {
          key: 'getOptions',
          value: function getOptions(segment, index) {
            var _this2 = this;

            if (segment.type === 'operator') {
              return this.$q.when(this.uiSegmentSrv.newOperators(['=', '!=', '<', '>', '=~', '!~']));
            }

            if (segment.type === 'condition') {
              return this.$q.when([this.uiSegmentSrv.newSegment('AND')]);
            }

            var ds = this.datasource;
            var options = {};
            var promise = null;

            if (segment.type !== 'value') {
              promise = ds.getTagKeys();
            } else {
              options.key = this.segments[index - 2].value;
              promise = ds.getTagValues(options);
            }

            return promise.then(function (results) {
              results = _.map(results, function (segment) {
                return _this2.uiSegmentSrv.newSegment({ value: segment.text });
              });

              // add remove option for keys
              if (segment.type === 'key') {
                results.splice(0, 0, angular.copy(_this2.removeTagFilterSegment));
              }
              return results;
            });
          }
        }, {
          key: 'segmentChanged',
          value: function segmentChanged(segment, index) {
            this.segments[index] = segment;

            // handle remove tag condition
            if (segment.value === this.removeTagFilterSegment.value) {
              this.segments.splice(index, 3);
              if (this.segments.length === 0) {
                this.segments.push(this.uiSegmentSrv.newPlusButton());
              } else if (this.segments.length > 2) {
                this.segments.splice(Math.max(index - 1, 0), 1);
                if (this.segments[this.segments.length - 1].type !== 'plus-button') {
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

              if (index + 1 === this.segments.length) {
                this.segments.push(this.uiSegmentSrv.newPlusButton());
              }
            }

            this.updateVariableModel();
          }
        }, {
          key: 'updateVariableModel',
          value: function updateVariableModel() {
            var filters = [];
            var filterIndex = -1;
            var hasFakes = false;
            this.segments.forEach(function (segment) {
              if (segment.type === 'value' && segment.fake) {
                hasFakes = true;
                return;
              }
              switch (segment.type) {
                case 'key':
                  {
                    filters.push({ key: segment.value });
                    filterIndex += 1;
                    break;
                  }
                case 'value':
                  {
                    filters[filterIndex].value = segment.value;
                    break;
                  }
                case 'operator':
                  {
                    filters[filterIndex].operator = segment.value;
                    break;
                  }
                case 'condition':
                  {
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
        }]);

        return CloudflareQueryCtrl;
      }(QueryCtrl));

      CloudflareQueryCtrl.templateUrl = 'datasource/query_editor.html';

      _export('CloudflareQueryCtrl', CloudflareQueryCtrl);
    }
  };
});
//# sourceMappingURL=query_editor.js.map
