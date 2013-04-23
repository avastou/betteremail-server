'use strict';
var Q = require('q');
module.exports = function (baseModel) {
    var labels = Object.create(baseModel);

    //To implement in case we want to add methods to the
    //fetched element.
    //
    // labels.afterGet = function (elem){
    //     return elem;
    // };
    //
    labels.beforeInsert = function (elem) {
        elem._id = undefined;
        return elem;
    }
    labels.getById = function getById(id) {
        return this._getById(id,'labels');
    };

    labels.getByName = function getByName(name) {
        var deferred = Q.defer();
        // console.log('[getByName] - name:', name);
        this._getAll('labels', {
            name: name
        }).then(function onResult(labels) {
            if (labels.length <= 0) {
                deferred.resolve(null);
            } else {
                deferred.resolve(labels);
            }
        }, function (err) {
            deferred.reject(err);
            console.log(err);
        }).fail(function onError(err) {
            console.log('[ERROR]',err);
            deferred.reject(err);
        });
        return deferred.promise;
    };

    labels.new = function (label) {
        return this._insert(label,'labels');
    };
    return labels;
};
