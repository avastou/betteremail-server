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
    Q = require('Q'),
    m = new di.Module(),
    fix,
    baseModel;
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('../lib/models/baseModel'));
m.value('config', config);



describe('baseModel', function () {

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

    it('should expose a _getAll method', function () {
        expect(baseModel._getAll).toBeDefined();
        expect(typeof baseModel._getAll).toBe('function');
    });

    it('should expose a _insert method', function () {
        expect(baseModel._insert).toBeDefined();
        expect(typeof baseModel._insert).toBe('function');
    });

    describe('_getById', function () {
        it('should return a Q promise', function () {
            var promise = baseModel._getById('516c2c85a25b4edb21000006', 'labels');
            expect(promise).toBeAPromise();
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

    describe('_getAll', function () {
        it('should return a promise', function () {
            var promise = baseModel._getAll('labels');
            expect(promise).toBeAPromise();
        });

        it('should get all the elements', function (done) {
            baseModel._getAll('labels').then(function (labels) {
                expect(labels).toBeDefined();
                expect(labels.length).toBe(4);
                expect(labels[3].name).toBe('test_label_4');
                done();
            });
        });

        it('should notify elements 1 by 1', function (done) {
            var labels = [];
            baseModel._getAll('labels').progress(function (label) {
                expect(label.name).toMatch(/^test_label_./);
                labels.push(label);
            }).then(function () {
                expect(labels.length).toBe(4);
                expect(labels[3].name).toBe('test_label_4');
                done();
            });
        });

        it('should allow filtering', function (done) {
            var labels = [];
            baseModel._getAll('labels', {
                name: 'test_label_4'
            }).progress(function (label) {
                expect(label.name).toBe('test_label_4');
                labels.push(label);
            }).then(function () {
                expect(labels.length).toBe(1);
                done();
            });
        });

        it('should return an empty array if no match is found', function (done) {
            baseModel._getAll('labels', {
                name: 'AN_UNEXISTANT_NAME'
            }).then(function (labels) {
                expect(labels).toBeAnArray();
                expect(labels.length).toBe(0);
                done();
            });
        });
    });
    describe('_insert', function () {
        it('should insert a new item', function (done) {
            var newLabel = {
                name: 'new_label',
            };
            baseModel._insert(newLabel, 'labels').then(function (labels) {
                expect(labels[0].name).toBe('new_label');
                expect(labels[0]._id).toBeDefined();
                baseModel._getById(labels[0]._id.toString(), 'labels').then(function (label) {
                    expect(label).toEqual(labels[0]);
                    done();
                });
            });
        });

        it('should insert a new set of items', function (done) {
            var newLabels = [{
                name: 'new_label1',
            }, {
                name: 'new_label2',
            }, {
                name: 'new_label3',
            }];
            baseModel._insert(newLabels, 'labels').then(function (labels) {
                expect(labels).toBeAnArray();
                expect(labels.length).toBe(3);
                baseModel._getAll('labels', {
                    name: /^new_label[1-3]$/
                }).then(function (labels) {
                    expect(labels).toBeAnArray();
                    expect(labels).toEqual(newLabels);
                    done();
                });
            });
        });
    });
});
