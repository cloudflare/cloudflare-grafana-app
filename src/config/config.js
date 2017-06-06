import configTemplate from './config.html!text';

import _ from 'lodash' ;

class CloudflareConfigCtrl {
  constructor($scope, $injector, backendSrv) {
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

  preUpdate() {
    if (this.appModel.secureJsonData.token)  {
      this.appModel.jsonData.tokenSet = true;
    }

    return this.initDatasource();
  }

  postUpdate() {
    if (!this.appModel.enabled) {
      return Promise.resolve();
    }
    var self = this;
    return this.validateApiConnection().then(() => {
      return self.appEditCtrl.importDashboards()
    });
  }

  /* Make sure that we can hit the Cloudflare API. */
  validateApiConnection() {
    var promise = this.backendSrv.get(this.baseUrl + '/user');
    promise.then((resp) => {
      this.apiValidated = true;
      /* Update organizations list */
      let promises = [];
      let organizations = [];
      this.appModel.jsonData.clusters = [];
      let organizationList = resp.result.organizations || [];
      organizationList.forEach(e => {
        if (e.name != "SELF") {
          organizations.push({name: e.name, id: e.id, status: e.status});
          /* Update list of clusters */
          promises.push(this.backendSrv.get(
            this.baseUrl + '/organizations/' + e.id + '/virtual_dns').then(resp => {
              resp.result.forEach(c => {
                c.organization = e.id;
                this.appModel.jsonData.clusters.push(c);
              });
          }));
        }
      });
      /* Update user-level list of clusters */
      promises.push(this.backendSrv.get(
        this.baseUrl + '/user/virtual_dns').then(resp => {
          resp.result.forEach(c => {
            this.appModel.jsonData.clusters.push(c);
          });
      }));
      this.appModel.jsonData.organizations = organizations;
      return Promise.all(promises);
    }, () => {
      this.apiValidated = false;
      this.apiError = true;
    });
    return promise;
  }

  reset() {
    this.appModel.jsonData.clusters = [];
    this.appModel.jsonData.organizations = [];
    this.appModel.jsonData.email = '';
    this.appModel.jsonData.tokenSet = false;
    this.appModel.secureJsonData = {};
    this.apiValidated = false;
  }

  initDatasource() {
    /* Check for existing datasource, or create a new one */
    var self = this;
    return self.backendSrv.get('api/datasources').then(function(results) {
      var foundDs = false;
      _.forEach(results, function(ds) {
        if (foundDs) { return; }
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
          jsonData: {},
        };
        promises.push(self.backendSrv.post('api/datasources', ds));
      }
      return Promise.all(promises);
    });
  }
}

CloudflareConfigCtrl.template = configTemplate;

export {
  CloudflareConfigCtrl as ConfigCtrl
};
