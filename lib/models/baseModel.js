/*jshint camelcase:false*/
(function (undefined) {
    'use strict';
    var Q = require('q');
    var BSON = require('mongodb').BSONPure;


    module.exports = function (db) {
        return {
            afterGet: function (element) {
                return element;
            },
            beforeInsert: function (element) {
                return element;
            },
            _getById: function _getById(id, collection) {
                var deferred = Q.defer();
                var that = this;
                db.open(function (err, db) {
                    db.collection(collection, function (err, collection) {
                        if (err) {
                            db.close();
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
                                db.close();
                                deferred.reject(err);

                            } else if (!results) {
                                db.close();
                                deferred.reject({
                                    msg: 'NO_RESULT',
                                });
                            } else {
                                db.close();
                                deferred.resolve(that.afterGet(results));
                            }
                        });
                    });
                });
                return deferred.promise;
            },
            _getAll: function getAll(collectionName, queryObj, limit) {
                var deferred = Q.defer();
                var that = this;
                try {
                    db.open(function (err, db) {
                        if (err) {
                            deferred.reject(err);
                            console.log('err: ', err);
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
                            if (typeof limit === 'number') {
                                cursor = cursor.limit(limit);
                            }
                            var documents = [];
                            cursor.count(function (err, size) {
                                if (err) {
                                    deferred.reject(err);
                                    console.error('[ERROR]', err);
                                    db.close();
                                    return;
                                }
                                if (size === 0) {
                                    deferred.resolve([]);
                                    return;
                                }
                                cursor.each(function (err, document) {
                                    if (err) {
                                        deferred.reject(err);
                                        console.error('[ERROR]', err);
                                        db.close();
                                        return;
                                    }
                                    if (document === null) {
                                        deferred.resolve(documents);
                                        db.close();
                                        return;
                                    }
                                    var item = that.afterGet(document);
                                    documents.push(item);
                                    deferred.notify(item);
                                });
                            });

                        });
                    });
                } catch (e) {
                    db.close();
                    deferred.reject(e);
                }
                // deferred.resolve([{}, {}, {}, {}]);
                return deferred.promise;
            },
            _insert: function (items, collectionName) {
                var deferred = Q.defer();
                if (Array.isArray(items)) {
                    items.map(this.beforeInsert, this);
                } else {
                    items = this.beforeInsert(items);
                }
                db.open(function (err, db) {
                    db.collection(collectionName, function (err, collection) {
                        if (err) {
                            db.close();
                            deferred.reject(err);
                            return;
                        }

                        collection.insert(items, function (err, result) {
                            if (err) {
                                deferred.reject(err);
                                db.close();
                                return;
                            }
                            deferred.resolve(result);

                        });
                    });
                });
                return deferred.promise;
            },
            _bulkUpdate: function (collectionName, query, update) {
                var deferred = Q.defer();
                db.open(function (err, db) {
                    if (err) {
                        db.close();
                        deferred.reject(err);
                        return;
                    }
                    db.collection(collectionName, function (err, collection) {
                        if (err) {
                            db.close();
                            deferred.reject(err);
                            return;
                        }
                        collection.update(query, update,{multi: true}, function (err, result) {
                            if (err) {
                                db.close();
                                deferred.reject(err);
                                return;
                            }
                            deferred.resolve(result);
                        });
                    });

                });
                return deferred.promise;
            },
            _update: function (item, collectionName) {
                var deferred = Q.defer();
                db.open(function (err, db) {
                    if (err) {
                        db.close();
                        deferred.reject(err);
                        return;
                    }
                    db.collection(collectionName, function (err, collection) {
                        if (err) {
                            db.close();
                            deferred.reject(err);
                            return;
                        }
                        collection.save(item, function (err, result) {
                            if (err) {
                                db.close();
                                deferred.reject(err);
                                return;
                            }
                            deferred.resolve(result);
                        });
                    });

                });
                return deferred.promise;
            },
        };
    };

}());
