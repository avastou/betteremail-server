'use strict';
var di = require('di'),
    injector,
    Q = require('Q'),
    m = new di.Module(),
    fix,
    emails;
m.value('config', {
    dbName: 'bettermailTest',
    dbHost: '127.0.0.1',
    dbPort: 27017
});
m.factory('db', require('../lib/models/db'));
m.factory('baseModel', require('../lib/models/baseModel'));
// m.factory('baseModel', require('./mock/baseModelMock.js'));
m.factory('emails', require('../lib/models/emails'));

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
        fix = fixtures.load(__dirname + '/fixtures/emails');
        // console.log(fix);
        fixtures.save(fix, db, function () {
            db.close();
            done();
        });

    });
    it('should have a getThread method', function () {

        expect(emails.getThread).toBeDefined();
        expect(typeof emails.getThread).toBe('function');
    });

    it('should have a getByMessageId method', function () {

        expect(emails.getByMessageId).toBeDefined();
        expect(typeof emails.getByMessageId).toBe('function');
    });

    describe('getThread', function () {
        it('should return a promise', function () {
            expect(emails.getThread([])).toBeAPromise();
        });

        it('should fetch messages in the same thread by references array', function (done) {
            var references = [
                    'CAJeHU4BZjDe7YR=xm5V4D76pvgQQ9ufB-YG5n6f5J81dt8OWTg@mail.gmail.com',
                    'CALwaUUMKkskm9bOjn44rWc97jgfQDEpie06JHCrT-8Ofe6b5ww@mail.gmail.com'
                ];
            var promise = emails.getThread(references);
            promise.then(function (emails) {
                expect(emails).toBeAnArray();
                expect(emails.length).toBe(12);
                done();

            });
        });
    });

    describe('getByMessageId', function () {
        it('should resolve to null if no messageId provided', function (done) {
            emails.getByMessageId('A_DUMMY_MSG_ID').done(function (email) {
                expect(email).toBe(null);
                done();
            });
        });
        it('should find the right email', function (done) {
            emails.getByMessageId(fix.emails[0].messageId).done(function (email) {
                expect(email).toEqual(fix.emails[0]);
                done();
            });
        });


    });
});
