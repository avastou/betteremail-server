'use strict';
var di = require('di'),
    db,
    config = {
        dbName: 'bettermailTest',
        dbHost: '127.0.0.1',
        dbPort: 27017
    },
    injector,
    Q = require('Q'),
    m = new di.Module(),
    fix,
    labels;

m.value('config', config);
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('../lib/models/baseModel'));
m.factory('labels', require('../lib/models/labels'));




describe('labels model', function () {

    beforeEach(function (done) {
        this.addMatchers({

            toBeAnArray: function () {
                var actual = this.actual;
                var notText = this.isNot ? ' not' : '';

                this.message = function () {
                    return 'Expected ' + actual + notText + ' to be an Array';
                };

                return Array.isArray(actual);
            },
            toBeAPromise: function () {
                var actual = this.actual;
                var notText = this.isNot ? ' not' : '';

                this.message = function () {
                    return 'Expected ' + actual + notText + ' to be a Q promise';
                };

                return Q.isPromise(actual);
            }

        });
        //Dependency injection test config
        injector = new di.Injector([m]);
        db = injector.get('db');
        labels = injector.get('labels');
        //reset the 'test' db with fixtures from json
        var fixtures = require('mongodb-fixtures');
        fix = fixtures.load(__dirname + '/fixtures');
        fixtures.save(fix, db, function () {
            db.close();
            done();
        });
    });

    it('should expose a getById method', function () {
        expect(labels.getById).toBeDefined();
        expect(typeof labels.getById).toBe('function');
    });
});
