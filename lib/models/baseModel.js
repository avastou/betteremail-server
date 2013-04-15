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
            _getAll: function getAll(collectionName, queryObj) {
                var deferred = Q.defer();
                db.open(function (err, db) {
                    if (err) {
                        deferred.reject(err);
                        db.close();
                        return;
                    }
                    db.collection(collectionName, function (err, collection) {
                        if (err) {
                            deferred.reject(err);
                            db.close();
                            return;
                        }
                        var cursor = collection.find(queryObj);
                        var documents = [];
                        cursor.each(function (err, document) {
                            if (err) {
                                deferred.reject(err);
                                db.close();
                                return;
                            }
                            if (document === null) {
                                deferred.resolve(documents);
                                db.close();
                                return;
                            }
                            documents.push(document);
                            deferred.notify(document);
                        });
                    });
                });
                // deferred.resolve([{}, {}, {}, {}]);
                return deferred.promise;
            },
            _insert: function (items, collectionName) {
                var deferred = Q.defer();
                db.open(function (err, db) {
                    db.collection(collectionName, function (err, collection) {
                        if (err) {
                            deferred.reject(err);
                            db.close();
                            return;
                        }

                        collection.insert(items, function (err, result) {
                            if (err) {
                                deferred.reject(err);
                                db.close();
                                return;
                            }
                            deferred.resolve(result);
                            db.close();
                        });
                    });
                });
                return deferred.promise;
            },
        };
    };

}());
