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
            this.validateApiConnection();
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
            var self = this;
            return this.validateApiConnection().then(function () {
              return self.appEditCtrl.importDashboards();
            });
          }
        }, {
          key: 'validateApiConnection',
          value: function validateApiConnection() {
            var _this = this;

            var promise = this.backendSrv.get(this.baseUrl + '/user');
            promise.then(function (resp) {
              _this.apiValidated = true;
              /* Update organizations list */
              var promises = [];
              var organizations = [];
              _this.appModel.jsonData.clusters = [];
              var organizationList = resp.result.organizations || [];
              organizationList.forEach(function (e) {
                if (e.name != "SELF") {
                  organizations.push({ name: e.name, id: e.id, status: e.status });
                  /* Update list of clusters */
                  promises.push(_this.backendSrv.get(_this.baseUrl + '/organizations/' + e.id + '/virtual_dns').then(function (resp) {
                    resp.result.forEach(function (c) {
                      c.organization = e.id;
                      _this.appModel.jsonData.clusters.push(c);
                    });
                  }));
                }
              });
              /* Update user-level list of clusters */
              promises.push(_this.backendSrv.get(_this.baseUrl + '/user/virtual_dns').then(function (resp) {
                resp.result.forEach(function (c) {
                  _this.appModel.jsonData.clusters.push(c);
                });
              }));
              _this.appModel.jsonData.organizations = organizations;
              return Promise.all(promises);
            }, function () {
              _this.apiValidated = false;
              _this.apiError = true;
            });
            return promise;
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
              var foundDs = false;
              _.forEach(results, function (ds) {
                if (foundDs) {
                  return;
                }
                if (ds.name === "cloudflare") {
                  foundDs = true;
                }
              });
              /* Create a new datasource */
              var promises = [];
              if (!foundDs) {
                var ds = {
                  name: 'cloudflare',
                  type: 'cloudflare-api',
                  access: 'direct',
                  jsonData: {}
                };
                promises.push(self.backendSrv.post('api/datasources', ds));
              }
              return Promise.all(promises);
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
