'use strict';
var Q = require('q');
var sync = require('../lib/sync');
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
                syncManager = sync.create();
            });

            it('should return a Q promise', function () {
                console.log(syncManager);
                var promise = syncManager.start();
                expect(Q.isPromise(promise)).toBe(true);
            });


        });
    });
});
