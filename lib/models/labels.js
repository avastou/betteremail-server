'use strict';

module.exports = function (baseModel) {
    var labels = Object.create(baseModel);
    labels.getById = function (id) {
        return this._getById(id,'labels');
    };

    return labels;
};
