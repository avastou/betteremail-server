(function () {
    'use strict';
    var Q = require('q'),
        _ = require('underscore')._;

    var create = function create(db) {
        var lastSeenUid = 0;
        var start = function start() {
            var deferred = Q.defer();
            // console.log(db);
            return deferred.promise;
        };

        return {
            start: start,
        };

    };

    module.exports = {
        create: create
    };


}());
