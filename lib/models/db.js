/*jshint camelcase:false*/

module.exports = function (config) {
    'use strict';
    var Db = require('mongodb').Db,
        Server = require('mongodb').Server;
    return new Db(config.dbName, new Server(config.dbHost, config.dbPort, {
        auto_reconnect: true,
        poolSize: 7
    }), {
        w: 1
    });
};
