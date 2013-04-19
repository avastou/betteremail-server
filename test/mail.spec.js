'use strict';
var di = require('di'),
    injector,
    Q = require('Q'),
    m = new di.Module(),
    fix,
    emails;
m.value('config',{
        dbName: 'bettermailTest',
        dbHost: '127.0.0.1',
        dbPort: 27017
    });
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('../lib/models/baseModel'));
// m.factory('baseModel', require('./mock/baseModelMock.js'));
m.factory('labels', require('../lib/models/labels'));


describe('email model', function () {

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

        injector = new di.Injector([m]);
        emails = injector.get('emails');
        var db = injector.get('db');
        var fixtures = require('mongodb-fixtures');
        fix = fixtures.load(__dirname + '/fixtures');
        fixtures.save(fix, db, function () {
            db.close();
            done();
        });


    });
});
