/*jshint camelcase:false*/

module.exports = function (config) {
    'use strict';
    var Db = require('mongodb').Db,
        Server = require('mongodb').Server,
        dbInstance,
        myDb,
        db = new Db(config.dbName, new Server(config.dbHost, config.dbPort, {
            auto_reconnect: true,
            poolSize: 7
        }), {
            w: 1
        });

    myDb = Object.create(db);
    var connected = false;
    myDb.open = function myOpen(cb) {
        if (connected) {
            cb(undefined, dbInstance);
        } else {

            db.open(function (err, dbI) {
                if (err) {
                    cb(err);
                    return;
                }
                connected = true;
                dbInstance = dbI;
                cb(undefined, dbInstance);
            });
        }
    };

    myDb.close = function nop() {

    };
    // return dbDb;
    return myDb;



};
