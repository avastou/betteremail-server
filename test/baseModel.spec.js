'use strict';
var baseModel,
di = require('di'),
    db,
    config = {
        dbName: 'bettermailTest',
        dbHost: '127.0.0.1',
        dbPort: 27017
    },
    injector,
    Q = require('Q');


var m = new di.Module();
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('../lib/models/baseModel'));
m.value('config', config);
var fix;
var baseModel;
describe('baseModel', function () {

    beforeEach(function (done) {

        //Dependency injection test config
        injector = new di.Injector([m]);
        db = injector.get('db');

        //reset the 'test' db with fixtures from json
        var fixtures = require('mongodb-fixtures');
        fix = fixtures.load(__dirname + '/fixtures');
        fixtures.save(fix, db, function () {
            db.close();
            done();
        });

        baseModel = injector.get('baseModel');
    });

    it('should be defined', function () {
        expect(baseModel).toBeDefined();
    });

    it('should expose a _getById method', function () {
        expect(baseModel._getById).toBeDefined();
        expect(typeof baseModel._getById).toBe('function');
    });

    describe('_getById', function () {


        it('should return a Q promise', function () {
            var promise = baseModel._getById('516c2c85a25b4edb21000006', 'labels');
            expect(Q.isPromise(promise)).toBe(true);
        });

        it('should fail for non-existent keys', function (done) {
            baseModel._getById('516c2c85a25b4edb21000006', 'labels').fail(

            function (reason) {
                expect(reason).toBeDefined();
                expect(reason.msg).toBeDefined();
                expect(reason.msg).toBe('NO_RESULT');
                done();

            });
        });

        it('should find the right element', function (done) {
            var testLabel1 = fix.labels[0];
            // console.log(testLabel1._id.toString());
            baseModel._getById(testLabel1._id.toString(), 'labels').then(function (label) {
                expect(label).toBeDefined();
                expect(label.name).toBe('test_label_1');
                done();
            });
        });


    });
});
