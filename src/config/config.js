import configTemplate from './config.html!text';

import _ from 'lodash' ;

class CloudflareConfigCtrl {
  constructor($scope, $injector, backendSrv) {
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

  // make sure that we can hit the Cloudflare API.
  validateApiConnection() {
    var promise = this.backendSrv.get('api/plugin-proxy/cloudflare-app/api/v4/user');
    promise.then((resp) => {
      this.apiValidated = true;
    }, () => {
      this.apiValidated = false;
      this.apiError = true;
    });
    return promise;
  }

  reset() {
    this.appModel.jsonData.email = '';
    this.appModel.jsonData.tokenSet = false;
    this.appModel.secureJsonData = {};
    this.apiValidated = false;
  }

  initDatasource() {
    var self = this;
    //check for existing datasource.
    return self.backendSrv.get('api/datasources').then(function(results) {
      var foundDs = false;
      _.forEach(results, function(ds) {
        if (foundDs) { return; }
        if (ds.name === "cloudflare") {
          foundDs = true;
        }
      });
      var promises = [];
      if (!foundDs) {
        // create datasource.
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
}

CloudflareConfigCtrl.template = configTemplate;

export {
  CloudflareConfigCtrl as ConfigCtrl
};
