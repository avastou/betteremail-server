'use strict';
var di = require('di');
var db = require('../models/db');
var config = {
    dbName: 'bettermail',
    dbHost: '127.0.0.1',
    dbPort: 27017
};

var m = module.exports = new di.Module();
m.factory('db', db);
m.factory('baseModel', require('../models/baseModel'));
m.factory('labels', require('../models/labels'));
m.value('config', config);
