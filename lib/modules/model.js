'use strict';
var di = require('di');
var db = require('../models/db');
var config = {
    dbName: 'bettermail',
    dbHost: '127.0.0.1',
    dbPort: 27017
};
var m = module.exports = new di.Module();

m.value('config', config);
m.factory('db', db);
m.factory('baseModel', require('../models/baseModel'));
m.factory('labels', require('../models/labels'));
m.factory('emails', require('../models/emails'));
m.factory('syncManager', require('../sync'));

