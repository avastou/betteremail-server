'use strict';
var di = require('di'),
    config = {
        dbName: 'bettermailTest',
        dbHost: '127.0.0.1',
        dbPort: 27017
    },
    injector,
    Q = require('Q'),
    m = new di.Module(),
    labels,
    baseModelMock;

m.value('config', config);
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('./mock/baseModelMock.js'));
m.factory('labels', require('../lib/models/labels'));



describe('labels model', function () {

    beforeEach(function () {
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
        // db = injector.get('db');
        labels = injector.get('labels');

        baseModelMock = injector.get('baseModel');
        // console.log('mock:',baseModelMock);
        //reset the 'test' db with fixtures from json
        // var fixtures = require('mongodb-fixtures');
        // fix = fixtures.load(__dirname + '/fixtures');
        // fixtures.save(fix, db, function () {
        //     db.close();
        //     done();
        // });
    });

    it('should expose a getById method', function () {
        expect(labels.getById).toBeDefined();
        expect(typeof labels.getById).toBe('function');
    });
    describe('getById', function () {
        it('should find the right element', function (done) {
            var testLabel1 = {
                name: 'test',
                _id: 'anId',
            };
            baseModelMock.expectGet('labels', testLabel1);
            labels.getById('anId').done(function (label) {
                expect(label).toBeDefined();
                expect(label.name).toBe('test');
                done();
            });
        });
    });

    describe('getByName', function () {
        it('should find elements by name', function (done) {
            var testLabel1 = {
                name: 'test'
            };
            baseModelMock.expectGet('labels', [testLabel1]);
            // console.log(testLabel1._id.toString());
            labels.getByName(testLabel1.name).done(function (labels) {
                expect(labels).toBeDefined();
                expect(labels).toBeAnArray();
                expect(labels.length).toBe(1);
                expect(labels[0].name).toEqual(testLabel1.name);
                done();
            });
        });

        it('should return null if no match is found', function (done) {
            baseModelMock.expectGet('labels', []);
            labels.getByName('A_NONEXISTANT_NAME').done(function (label) {
                expect(label).toBeDefined();
                expect(label).toBe(null);
                done();
            });
        });
    });

    describe('new', function () {
        it('should add a new label to the db', function (done) {
            var newlabel = {
                name: 'A_NEW_LABEL',
                next: 123,
            };
            baseModelMock.expectInsert('labels', [newlabel]);
            baseModelMock.expectGet('labels', [newlabel]);
            labels.new(newlabel).then(function (labelArray) {
                expect(labelArray[0]).toBeDefined();
                expect(labelArray[0].name).toEqual(newlabel.name);
                expect(labelArray[0].next).toEqual(newlabel.next);
                return labels.getByName('A_NEW_LABEL');
            }).then(function (labelArray) {
                expect(labelArray[0]).toBeDefined();
                expect(labelArray[0].name).toEqual(newlabel.name);
                expect(labelArray[0].next).toEqual(newlabel.next);
                done();
            });
        });
    });
});
