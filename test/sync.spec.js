'use strict';
var Q = require('q'),
    di = require('di');

var sync = require('../lib/sync');
var injector;
describe('sync module', function () {
    it('should export a create function', function () {
        expect(sync.create).toBeDefined();
        expect(typeof sync.create).toBe('function');
    });
    describe('create', function () {
        it('should return an object', function () {
            expect(typeof sync.create()).toBe('object');
        });

        describe('start', function () {
            var syncManager;
            beforeEach(function () {
                module = new di.Module()
                module.value('db',{});
                injector = new di.Injector([module])
                syncManager = injector.invoke(sync.create);
            });

            it('should return a Q promise', function () {
                var promise = syncManager.start();
                expect(Q.isPromise(promise)).toBe(true);
            });


        });
    });
});
