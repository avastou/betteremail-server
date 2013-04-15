'use strict';
var init = require('./baseModel').init;


module.exports = function (config) {
    var baseModel = init(config);
    var labels = Object.create(baseModel);

    labels.getById = function (labelName) {
        return this._getById(labelName,'labels');
    };
};
