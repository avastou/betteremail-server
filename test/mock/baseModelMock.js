/*jshint camelcase:false*/
(function (undefined) {
    'use strict';
    var Q = require('q');


    module.exports = function () {
        var cacheGet = {},
            cacheInsert = {};

        return {
            expectGet: function (collectionName, response) {
                if (!cacheGet[collectionName]) {
                    cacheGet[collectionName] = [];
                }
                cacheGet[collectionName].push(response);
            },
            expectInsert: function (collectionName, response){
                if (!cacheInsert[collectionName]) {
                    cacheInsert[collectionName] = [];
                }
                cacheInsert[collectionName].push(response);
            },
            // afterGet: function (element) {
            //     return element;
            // },
            _getById: function _getById(id, collectionName) {
                var deferred = Q.defer();
                if (cacheGet[collectionName].length <= 0) {
                    throw 'Unexpected get by id, id:' + id + ' collection ' + collectionName;
                }
                deferred.resolve(cacheGet[collectionName].shift());
                return deferred.promise;
            },
            _getAll: function getAll(collectionName, queryObj) {
                var deferred = Q.defer();
                if (cacheGet[collectionName].length <= 0) {
                    throw 'Unexpected getAll on collection ' + collectionName + ' queryObj: ' + JSON.stringify(queryObj);
                }
                deferred.resolve(cacheGet[collectionName].shift());
                return deferred.promise;
            },
            _insert: function (items, collectionName) {
                var deferred = Q.defer();
                if (cacheInsert[collectionName].length <= 0) {
                    throw 'Unexpected insert on collection ' + collectionName + ' items: ' + JSON.stringify(items);
                }
                deferred.resolve(cacheInsert[collectionName].shift());
                return deferred.promise;
            },
        };
    };

}());
