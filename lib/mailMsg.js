'use strict';
var _ = require('underscore')._,
    Q = require('q');

module.exports = function (email, emailMeta, imapConnection) {
    return _.extend({}, email, emailMeta, {
        addLabels: function (label) {
            var d = Q.defer();
            imapConnection.addLabels(emailMeta.uid, label, function (err) {
                if (err) {
                    d.reject(err);
                } else {
                    var labels = emailMeta['x-gm-labels'].concat(label);
                    d.resolve(labels);
                }
            });
            return d.promise;
        }
    });
};
