'use strict';

System.register(['./config/config.js', 'app/plugins/sdk'], function (_export, _context) {
  "use strict";

  var ConfigCtrl, loadPluginCss;
  return {
    setters: [function (_configConfigJs) {
      ConfigCtrl = _configConfigJs.ConfigCtrl;
    }, function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }],
    execute: function () {
      _export('ConfigCtrl', ConfigCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
