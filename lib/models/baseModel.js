/*jshint camelcase:false*/
(function (undefined) {
    'use strict';
    var Q = require('q');
    var BSON = require('mongodb').BSONPure;

    var connect = function connect() {
        var Db = require('mongodb').Db,
            Server = require('mongodb').Server,
            db = new Db(this.config.dbName, new Server(this.config.Host, this.config.Port, {
                auto_reconnect: true,
                poolSize: 4
            }));
        return db;

    };


    module.exports = function (db) {
        return {
            _getById: function _getById(id, collection) {
                var deferred = Q.defer();
                db.open(function (err, db) {
                    db.collection(collection, function (err, collection) {
                        if (err) {
                            deferred.reject(err);
                            return;
                        }
                        var oId = new BSON.ObjectID(id);
                        // console.log(id);
                        var cursor = collection.find({
                            '_id': oId
                        });
                        cursor.nextObject(function (err, results) {
                            if (err) {
                                deferred.reject(err);

                            } else {
                                deferred.resolve(results);
                            }
                            db.close();
                        });
                    });
                });
                return deferred.promise;
            },
        };
    };
    // init: function (config) {
    //     return {
    //         config: config,
    //         connect: connect,
    //         _getById: _getById
    //     };

    // },
    // connect: connect,
    // _getById: _getById,
}());
