(function() {
  'use strict';
  module.exports = function(ndx) {
    var callbacks, syncCallback;
    callbacks = {
      maintenanceOn: [],
      maintenanceOff: []
    };
    if (process.env.MAINTENANCE_MODE) {
      ndx.maintenanceMode = true;
    }
    syncCallback = function(name, obj, cb) {
      var callback, i, len, ref;
      if (callbacks[name] && callbacks[name].length) {
        ref = callbacks[name];
        for (i = 0, len = ref.length; i < len; i++) {
          callback = ref[i];
          callback(obj);
        }
      }
      return typeof cb === "function" ? cb() : void 0;
    };
    ndx.serverMaintenance = {
      authFn: function(user) {
        if (user && (user.hasRole('superadmin') || user.hasRole('system'))) {
          return true;
        }
        return false;
      },
      on: function(name, callback) {
        return callbacks[name].push(callback);
      },
      off: function(name, callback) {
        return callbacks[name].splice(callbacks[name].indexOf(callback), 1);
      }
    };
    ndx.app.use('/api/*', function(req, res, next) {
      if (ndx.maintenanceMode) {
        if (ndx.serverMaintenance.authFn(ndx.user) || req.originalUrl === '/api/login' || req.originalUrl === '/api/refresh-login' || req.originalUrl === '/api/logout') {
          next();
        } else {
          res.status(503).end('Server Maintenance');
        }
      } else {
        next();
      }
    });
    ndx.app.get('/api/maintenance-mode', function(req, res, next) {
      if (ndx.serverMaintenance.authFn(ndx.user)) {
        ndx.maintenanceMode = true;
        syncCallback('maintenanceOn', ndx.user);
        return res.end('OK');
      }
      return res.end('Not allowed');
    });
    return ndx.app.get('/api/maintenance-off', function(req, res, next) {
      if (ndx.serverMaintenance.authFn(ndx.user)) {
        ndx.maintenanceMode = false;
        syncCallback('maintenanceOff', ndx.user);
        return res.end('OK');
      }
      return res.end('Not allowed');
    });
  };

}).call(this);

//# sourceMappingURL=index.js.map
