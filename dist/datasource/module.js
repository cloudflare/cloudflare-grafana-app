'use strict';

System.register(['./datasource', './config', './query_editor'], function (_export, _context) {
  "use strict";

  var CloudflareDatasource, ConfigCtrl, CloudflareQueryCtrl;
  return {
    setters: [function (_datasource) {
      CloudflareDatasource = _datasource.CloudflareDatasource;
    }, function (_config) {
      ConfigCtrl = _config.ConfigCtrl;
    }, function (_query_editor) {
      CloudflareQueryCtrl = _query_editor.CloudflareQueryCtrl;
    }],
    execute: function () {
      _export('Datasource', CloudflareDatasource);

      _export('ConfigCtrl', ConfigCtrl);

      _export('QueryCtrl', CloudflareQueryCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
