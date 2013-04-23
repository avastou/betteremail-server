(function () {
    'use strict';
    var Q = require('q'),
        _ = require('underscore')._,
        getMailer = require('../lib/mail'),
        config = require('../config.json');


    module.exports = function (labels, emails) {
        var syncManager = {};

        syncManager.syncLabels = function syncLabels() {
            var deferred = Q.defer(),
                mail = getMailer(config);
            // return mail.boxes();
            mail.connect().then(function () {
                console.log('connected');
                mail.boxes().then(function (boxes) {
                    var out = [],
                        parentName = '',
                        boxOut;
                    _.each(boxes, function addBox(box, i) {
                        var oldParentName = parentName;
                        if (box.attribs.indexOf('NOSELECT') < 0 && box.attribs.indexOf('INBOX') < 0) {
                            boxOut = {
                                attribs: box.attribs,
                                delimiter: box.delimiter,
                                name: parentName + i,
                            };
                            out.push(boxOut);
                            // console.log(boxOut);
                        } else if (box.attribs.indexOf('INBOX') >= 0) {
                            boxOut = {
                                attribs: box.attribs,
                                delimiter: box.delimiter,
                                name: parentName + 'INBOX',
                            };
                            out.push(boxOut);
                        }
                        if (box.children !== null) {
                            oldParentName = parentName;
                            parentName += i + box.delimiter;
                            _.each(box.children, addBox);
                            parentName = oldParentName;
                        }
                    });


                    function fetchDbInfo(index) {
                        console.log('index: ', index);
                        if (index === out.length) {
                            console.log('promise resolved');
                            deferred.resolve();
                            mail.logout();
                        } else {
                            labels.getByName(out[index].name).then(function (dbBoxes) {
                                if (dbBoxes) {
                                    console.log('dbBoxes', dbBoxes);
                                    fetchDbInfo(index + 1);
                                } else {
                                    // mail = getMailer(config);
                                    mail.open(out[index].name, true).then(function (imapBox) {
                                        imapBox.name = out[index].name;
                                        console.log('New box info fetched for: ', imapBox.name);
                                        // mail.logout();
                                        labels.new(imapBox).then(function () {
                                            fetchDbInfo(index + 1);
                                        }, function (err) {
                                            console.log('Duplicate??', err);
                                            deferred.reject(err);
                                        });
                                    }).fail(function (err) {
                                        console.log(err);
                                        deferred.reject(err);
                                    });
                                }
                            }, function (err) {
                                console.log(err);
                                deferred.reject(err);
                                mail.logout();

                            }).fail(function (err) {
                                console.log(err);
                                deferred.reject(err);
                                mail.logout();
                            });
                        }
                    }

                    fetchDbInfo(0);

                });

            });
            return deferred.promise;
        };

        function fromTo(mail, boxName, from, to) {
            // var deferred = Q.defer();
            console.log('Fetching from ' + from + ' to ' + to);

            return mail.open(boxName, true).then(function () {
                var searchString = (parseInt(from, 10) + 1) + ':' + (parseInt(to, 10));
                return mail.fetch(searchString, {
                    struct: true,
                }, {
                    headers: {
                        fields: true, //['date', 'message-id', 'to', 'from', 'subject'],
                        parse: false
                    },
                    body: false,
                });
            });
        }


        syncManager.syncBox = function (boxName) {
            var pImap = null,
                pDb,
                labelDb,
                labelImap,
                mail = getMailer(config),
                deferred = Q.defer(),
                from = 0,
                to = 0,
                fetchedEmails = [];

            pDb = labels.getByName(boxName).then(function (label) {
                console.log('Olè 1');
                if (label !== null) {
                    labelDb = label[0];
                    return labelDb;
                }
                return null;

            });

            pImap = mail.connect().then(function () {
                console.log('connected');
                return mail.open(boxName, true).then(function (box) {
                    labelImap = box;
                    console.log('Olè 2');
                    return labelImap;
                });
            });


            Q.allResolved([pDb, pImap]).done(function () {
                console.log('All!');
                //No need to sync if lastSeenUid is the same as uidnext - 1
                if (labelDb && labelDb.lastSeenUid && labelDb.lastSeenUid >= labelImap.uidnext - 1) {
                    deferred.resolve();
                    return;
                }
                if (labelDb && labelDb.lastSeenUid) {
                    from = parseInt(labelDb.lastSeenUid, 10);
                }

                to = Math.min(labelImap.uidnext, from + 100);

                function doSync() {

                    return fromTo(mail, boxName, from, to).then(function (mails) {
                        console.log('Fetched ', mails.length, 'emails');
                        fetchedEmails = fetchedEmails.concat(mails);
                        if (to < labelImap.uidnext) {
                            from = to;
                            to = Math.min(labelImap.uidnext, to + 100);
                            return doSync();
                        } else {
                            return fetchedEmails;
                        }
                    });
                }

                doSync().then(function (result) {
                    mail.logout();
                    emails.new(result).then(function () {
                        deferred.resolve(result);
                        console.log('Stored ', result.length, ' emails globally');
                    }).fail(function (err){
                        deferred.reject(err);
                    });

                });

            });
            return deferred.promise;
        };
        return syncManager;
    };

}());
