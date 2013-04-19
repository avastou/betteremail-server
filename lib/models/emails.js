'use strict';
var Q = require('q');
module.exports = function (baseModel) {
    var emails = Object.create(baseModel);

    //To implement in case we want to add methods to the
    //fetched element.
    //
    // emails.afterGet = function (elem){
    //     return elem;
    // };
    emails.getById = function getById(id) {
        return this._getById(id, 'emails');
    };

    emails.getByUid = function getById(uid, label) {
        return this._getAll({
            uid: uid,
            label: label
        }, 'emails');
    };

    /**
     * return the messages belonging to a thread
     * @param  {string|[string]} arg If a single string is interpreted as the root message-id,
     *                               otherwhise as a references array
     * @return {promise} a Q promise for the fetched emails
     */
    emails.getThread = function getThread(arg) {
        var query = {};
        if (typeof arg === 'string') {
            query = {
                $or: [{
                    references: arg,
                }, {
                    messageId: arg,
                }]
            };
        } else if (Array.isArray(arg)) {
            query = {
                $or: [{
                    references: {$in: arg}
                },{
                    messageId: {$in: arg}
                }],
            };
        }
        return this._getAll('emails', query);
    };



    emails.new = function (email) {
        return this._insert(email, 'emails');
    };
    return emails;
};
