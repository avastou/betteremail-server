'use strict';
var di = require('di'),
    m = require('./lib/modules/model'),
    c = require('./lib/modules/cluster'),
    injector,
    rest;

m.factory('rest', require('./rest.js'));

injector = new di.Injector([m,c]);
rest = injector.get('rest');
rest.then(function (app) {
    console.log('listening on port 3000');
    app.listen(3000);
});
