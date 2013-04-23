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
    fix;

m.value('config', config);
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('../lib/models/baseModel'));
m.factory('labels', require('../lib/models/labels'));
m.factory('emails', require('../lib/models/emails'));
m.factory('syncManager', require('../lib/sync'));
var syncManager;

describe('syncManager', function () {
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

        //reset the 'test' db with fixtures from json
        var fixtures = require('mongodb-fixtures');
        fix = fixtures.load(__dirname + '/fixtures/labels');
        fixtures.save(fix, db, function () {
            db.close();
            done();
        });
        // done();
        syncManager = injector.get('syncManager');
    });
    it('should have a syncLabels function', function (done) {
        expect(syncManager.syncLabels).toBeDefined();
        expect(typeof syncManager.syncLabels).toBe('function');
        syncManager.syncBox('ArtKiller').done(function () {
            // console.log('boxes:', boxes);
            done();
        });
    }, 60000);

});
