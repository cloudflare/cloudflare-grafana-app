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
      this.validateApiConnection().then((is_updated) => {
        if (is_updated) {
          this.appEditCtrl.update();
        }
      });
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

    return this.appEditCtrl.importDashboards();
  }

  /* Make sure that we can hit the Cloudflare API. */
  validateApiConnection() {
    var self = this;
    let is_updated = false;
    var promise = this.backendSrv.get(this.baseUrl + '/accounts');
    return promise.then((resp) => {
      self.apiValidated = true;
      /* Update accounts list */
      let promises = [];
      let accounts = [];
      let accountList = resp.result || [];
      let clusters = [];
      accountList.forEach(e => {
        accounts.push({name: e.name, id: e.id});
        /* Update list of clusters */
        promises.push(self.backendSrv.get(
          self.baseUrl + '/accounts/' + e.id + '/virtual_dns').then(resp => {
            resp.result.forEach(c => {
              c.account = e.id;
              clusters.push({id: c.id, account: c.account, name: c.name});
            });
        }));
      });
      self.appModel.jsonData.accounts = accounts;
      return Promise.all(promises).then(() => {
        var previous = self.appModel.jsonData.clusters.map(x => { return x.id }).sort();
        var next = clusters.map(x => { return x.id }).sort();
        is_updated = !_.isEqual(previous, next);
        self.appModel.jsonData.clusters = clusters;
      })
    }, () => {
      self.apiValidated = false;
      self.apiError = true;
      return [];
    }).then(() => {
      return Promise.resolve(is_updated);
    });
  }

  reset() {
    this.appModel.jsonData.clusters = [];
    this.appModel.jsonData.accounts = [];
    this.appModel.jsonData.email = '';
    this.appModel.jsonData.tokenSet = false;
    this.appModel.secureJsonData = {};
    this.apiValidated = false;
  }

  initDatasource() {
    /* Check for existing datasource, or create a new one */
    var self = this;
    return self.backendSrv.get('api/datasources').then(function(results) {
      var exists = results.some((ds) => {
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
          jsonData: {},
      });
    });
  }
}

CloudflareConfigCtrl.template = configTemplate;

export {
  CloudflareConfigCtrl as ConfigCtrl
};
