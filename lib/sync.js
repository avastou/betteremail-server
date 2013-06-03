(function () {
    'use strict';
    var Q = require('q'),
        _ = require('underscore')._,
        getMailer = require('../lib/mail'),
        config;
    try {
        config = require('../config.json');
    } catch (e) {
        console.error('Unable to find config.json for user access');
        process.exit(1);
    }


    module.exports = function (labels, emails) {
        var syncManager = {};

        syncManager.syncLabels = function () {
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
                return mail.fetch(searchString, {}, {});
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

                to = Math.min(labelImap.uidnext, from + 50000);

                function doSync() {
                    return fromTo(mail, boxName, from, to).then(function (mails) {
                        console.log('Fetched ', mails.length, 'emails');
                        fetchedEmails = fetchedEmails.concat(mails);
                        if (to < labelImap.uidnext) {
                            from = to;
                            to = Math.min(labelImap.uidnext, to + 50000);
                            return doSync();
                        } else {
                            return fetchedEmails;
                        }
                    });
                }

                doSync().then(function (result) {
                    var lastSeenUid = 0;
                    result.forEach(function (email) {
                        if (email.uid > lastSeenUid) {
                            lastSeenUid = email.uid;
                        }
                    });

                    console.log('Saving ' + result.length + ' emails');
                    var pr = [];
                    if (result.length > 0) {
                        result.forEach(function (newEmail) {
                            pr.push(emails.new(newEmail));
                        });
                        Q.all(pr).then(function () {
                            if (!labelDb) {
                                labelImap.lastSeenUid = lastSeenUid;
                                labels.new(labelImap);
                            }
                            deferred.resolve(result);
                            console.log('Stored ', result.length, ' emails globally');
                        }, function (err) {
                            console.error('[ERROR]', err);
                            deferred.reject(err);
                        });
                    }


                });

            });
            return deferred.promise;
        };
        return syncManager;
    };

}());
