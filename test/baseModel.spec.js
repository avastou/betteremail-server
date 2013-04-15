'use strict';
var baseModel,
    di = require('di'),
    db,
    config = {
        dbName: 'bettermailTest',
        dbHost: '127.0.0.1',
        dbPort: 27017
    },
    injector;


var m = new di.Module();
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('../lib/models/baseModel'));
m.value('config', config);
injector = new di.Injector([m]);
var baseModel;
describe('baseModel', function () {

    beforeEach(function () {

        //Dependency injection test config

        db = injector.get('db');
        //reset the 'test' db with fixtures from json
        var fixtures = require('mongodb-fixtures');
        fixtures.load(__dirname + '/fixtures');
        fixtures.save(db, function () {
            db.close();
        });

        baseModel = injector.get('baseModel');
    });

    it('should be defined', function () {
        expect(baseModel).toBeDefined();
    });
});
