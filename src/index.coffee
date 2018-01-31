'use strict'

module.exports = (ndx) ->
  callbacks =
    maintenanceOn: []
    maintenanceOff: []
  if process.env.MAINTENANCE_MODE
    ndx.maintenanceMode = true
  syncCallback = (name, obj, cb) ->
    if callbacks[name] and callbacks[name].length
      for callback in callbacks[name]
        callback obj
    cb?()
  ndx.serverMaintenance =
    authFn: (user) ->
      if user and (user.hasRole('superadmin') or user.hasRole('system'))
        return true
      return false
    on: (name, callback) ->
      callbacks[name].push callback
    off: (name, callback) ->
      callbacks[name].splice callbacks[name].indexOf(callback), 1
  ndx.app.use '/api/*', (req, res, next) ->
    if ndx.maintenanceMode
      if ndx.serverMaintenance.authFn(ndx.user) or req.originalUrl is '/api/login' or req.originalUrl is '/api/refresh-login' or req.originalUrl is '/api/logout'
        next()
      else
        res.status(503).end 'Server Maintenance'
    else
      next()
    return
  ndx.app.get '/api/maintenance-mode', (req, res, next) ->
    if ndx.serverMaintenance.authFn ndx.user
      ndx.maintenanceMode = true
      syncCallback 'maintenanceOn', ndx.user
      return res.end 'OK'
    res.end 'Not allowed'
  ndx.app.get '/api/maintenance-off', (req, res, next) ->
    if ndx.serverMaintenance.authFn ndx.user
      ndx.maintenanceMode = false
      syncCallback 'maintenanceOff', ndx.user
      return res.end 'OK'
    res.end 'Not allowed'