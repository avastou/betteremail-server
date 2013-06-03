'use strict';
var Q = require('q');

module.exports = function (nerd, apiKey) {
    return {
        annotate: function (text) {
            var deferred = Q.defer();
            try {
                nerd.annotate(
                    'http://nerd.eurecom.fr/api/',
                apiKey,
                    'combined',
                    'text',
                text,
                    'oen',
                50 * 1000,

                function (err, contents) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    deferred.resolve(contents);
                });
            } catch (e) {
                console.log('Exception catched in nerd call: ', e);
                deferred.reject(e);
            }

            return deferred.promise;
        }
    };
};
