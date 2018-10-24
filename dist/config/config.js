'use strict';

System.register(['./config.html!text', 'lodash'], function (_export, _context) {
  "use strict";

  var configTemplate, _, _createClass, CloudflareConfigCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_configHtmlText) {
      configTemplate = _configHtmlText.default;
    }, function (_lodash) {
      _ = _lodash.default;
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

      _export('ConfigCtrl', CloudflareConfigCtrl = function () {
        function CloudflareConfigCtrl($scope, $injector, backendSrv) {
          var _this = this;

          _classCallCheck(this, CloudflareConfigCtrl);

          this.baseUrl = 'api/plugin-proxy/cloudflare-app/api/v4';
          this.backendSrv = backendSrv;

          this.appEditCtrl.setPreUpdateHook(this.preUpdate.bind(this));
          this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));

          if (!this.appModel.jsonData) {
            this.appModel.jsonData = {};
          }
          if (!this.appModel.secureJsonData) {
            this.appModel.secureJsonData = {};
          }

          this.apiValidated = false;
          this.apiError = false;

          if (this.appModel.enabled && this.appModel.jsonData.tokenSet) {
            this.validateApiConnection().then(function (is_updated) {
              if (is_updated) {
                _this.appEditCtrl.update();
              }
            });
          }
        }

        _createClass(CloudflareConfigCtrl, [{
          key: 'preUpdate',
          value: function preUpdate() {
            if (this.appModel.secureJsonData.token) {
              this.appModel.jsonData.tokenSet = true;
            }

            return this.initDatasource();
          }
        }, {
          key: 'postUpdate',
          value: function postUpdate() {
            if (!this.appModel.enabled) {
              return Promise.resolve();
            }

            return this.appEditCtrl.importDashboards();
          }
        }, {
          key: 'validateApiConnection',
          value: function validateApiConnection() {
            var self = this;
            var is_updated = false;
            var promise = this.backendSrv.get(this.baseUrl + '/user');
            return promise.then(function (resp) {
              self.apiValidated = true;
              /* Update organizations list */
              var promises = [];
              var organizations = [];
              var organizationList = resp.result.organizations || [];
              var clusters = [];
              organizationList.forEach(function (e) {
                if (e.name != "SELF" && e.id != "0") {
                  organizations.push({ name: e.name, id: e.id, status: e.status });
                  /* Update list of clusters */
                  promises.push(self.backendSrv.get(self.baseUrl + '/organizations/' + e.id + '/virtual_dns').then(function (resp) {
                    resp.result.forEach(function (c) {
                      c.organization = e.id;
                      clusters.push({ id: c.id, organization: c.organization, name: c.name });
                    });
                  }));
                }
              });
              /* Update user-level list of clusters */
              promises.push(self.backendSrv.get(self.baseUrl + '/user/virtual_dns').then(function (resp) {
                resp.result.forEach(function (c) {
                  clusters.push({ id: c.id, name: c.name });
                });
              }));
              self.appModel.jsonData.organizations = organizations;
              return Promise.all(promises).then(function () {
                var previous = self.appModel.jsonData.clusters.map(function (x) {
                  return x.id;
                }).sort();
                var next = clusters.map(function (x) {
                  return x.id;
                }).sort();
                is_updated = !_.isEqual(previous, next);
                self.appModel.jsonData.clusters = clusters;
              });
            }, function () {
              self.apiValidated = false;
              self.apiError = true;
              return [];
            }).then(function () {
              return Promise.resolve(is_updated);
            });
          }
        }, {
          key: 'reset',
          value: function reset() {
            this.appModel.jsonData.clusters = [];
            this.appModel.jsonData.organizations = [];
            this.appModel.jsonData.email = '';
            this.appModel.jsonData.tokenSet = false;
            this.appModel.secureJsonData = {};
            this.apiValidated = false;
          }
        }, {
          key: 'initDatasource',
          value: function initDatasource() {
            /* Check for existing datasource, or create a new one */
            var self = this;
            return self.backendSrv.get('api/datasources').then(function (results) {
              var exists = results.some(function (ds) {
                return ds.name === "cloudflare";
              });
              if (exists) {
                return Promise.resolve();
              }
              /* Create a new datasource */
              return self.backendSrv.post('api/datasources', {
                name: 'cloudflare',
                type: 'cloudflare-api',
                access: 'direct',
                jsonData: {}
              });
            });
          }
        }]);

        return CloudflareConfigCtrl;
      }());

      CloudflareConfigCtrl.template = configTemplate;

      _export('ConfigCtrl', CloudflareConfigCtrl);
    }
  };
});
//# sourceMappingURL=config.js.map
