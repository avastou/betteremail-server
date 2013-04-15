/*jshint camelcase:false*/
(function (undefined) {
    'use strict';
    var Q = require('q');
    var BSON = require('mongodb').BSONPure;



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

                            } else if (!results) {
                                deferred.reject({
                                    msg: 'NO_RESULT',
                                });
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

}());
