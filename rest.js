'use strict';

var express = require('express');
var app = express();
var getMailer = require('./lib/mail');
var config = require('./config.json');

var mail = getMailer(config);

// function walkParts(tree, type, subtype) {
//     var retval;
//     if (Array.isArray(tree)) {
//         for (var i in tree) {
//             retval = walkParts(tree[i], type, subtype);
//             if (retval) {
//                 return retval;
//             }
//         }
//     } else {
//         console.log(tree);
//         if (tree.type === type && tree.subtype === subtype) {
//             return tree;
//         }
//         return false;
//     }
// }

app.configure(function () {
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(require('./cors'));
    app.use(app.router);

});

mail.connect()
    .then(function () {
    console.log('Connected to GMAIL');

    app.get('/boxes', function (req, res) {
        mail.boxes().then(function (boxes) {
            var out = [];
            for (var i in boxes) {
                var box = boxes[i];
                var boxOut = {
                    attribs: box.attribs,
                    delimiter: box.delimiter,
                    name: i,
                };
                out.push(boxOut);
            }
            res.json(out);


        }, function (err) {
            console.log('errore', err);
            res.json(err);
        });

    });

    app.get('/boxes/:boxId', function (req, res) {
        var mail = getMailer(config);
        mail.connect().then(function () {
            mail.open(req.params.boxId, true).then(function (box) {
                res.json(box);
            }).fail(function (err) {
                res.json(err);
            })
                .
            finally(function () {
                mail.logout();
                console.log('Box: ' + req.params.boxId + ' closed');
            });
        });

    });

    app.get('/boxes/:boxId/unseen', function (req, res) {
        mail.open(req.params.boxId).then(function () {
            return mail.search(['UNSEEN']);
        }).then(function (uids) {
            return mail.fetch(uids, {}, {
                body: false,
                headers: {
                    fields: true,
                    parse: false,
                }
            });
        }).then(function (emails) {
            res.json(emails);
        }).fail(function (err) {
            res.json(err);
        });
    });

    app.get('/boxes/:boxId/from/:lastSeenUid', function (req, res) {
        var mail = getMailer(config);
        mail.connect().then(function () {
            return mail.open(req.params.boxId, true).then(function () {
                var searchString = (parseInt(req.params.lastSeenUid, 10) + 1) + ':*';
                return mail.fetch(searchString, {
                    struct: true,
                }, {
                    headers: {
                        fields: true, //['date', 'message-id', 'to', 'from', 'subject'],
                        parse: false
                    },
                    body: false,
                });
            }).then(function (emails) {
                res.json(emails);
            }).fail(function (err) {
                res.json(err);
            });
        }).
        finally(function () {
            mail.logout();
        });
    });

    /**
     * Fetch emails from start+1 to end (extreme included)
     */
    app.get('/boxes/:boxId/from/:start/to/:end', function (req, res) {
        var mail = getMailer(config);
        mail.connect().then(function () {
            return mail.open(req.params.boxId, true).then(function () {
                var searchString = (parseInt(req.params.start, 10) + 1) + ':' + (parseInt(req.params.end, 10));
                return mail.fetch(searchString, {
                    struct: true,
                }, {
                    headers: {
                        fields: true, //['date', 'message-id', 'to', 'from', 'subject'],
                        parse: false
                    },
                    body: false,
                });
            }).then(function (emails) {
                res.json(emails);
            }).fail(function (err) {
                res.json(err);
            });
        }).
        finally(function () {
            mail.logout();
        });
    });

    // app.get('/boxes/:boxId/:mailId/:partId', function (req, res) {
    //     var mail = getMailer(config);
    //     mail.connect().then(function () {
    //         return mail.open(req.params.boxId, true).then(function () {
    //             return mail.fetch(req.params.boxId, {}, {
    //                 id:req.params.partId,
    //                 headers: false,
    //                 body: true,
    //             }, true);
    //         }).then(function (emails) {
    //             res.json(emails);
    //         }).fail(function (err) {
    //             res.json(err);
    //         });
    //     }).
    //     finally(function () {
    //         mail.logout();
    //     });
    // });
    // app.get('/boxes/:boxId/all', function (req, res) {
    //     // res.json(require('./eurecom.json'));
    //     // return;
    //     var mail = getMailer(config);
    //     mail.connect().then(function () {
    //         mail.open(req.params.boxId, true).then(function () {
    //             var uids = [];
    //             var limit = 30;
    //             var today = new Date();
    //             var daysToFetch = 10;
    //             var start = new Date(today.getTime() - (1000 * 3600 * 24 * daysToFetch));
    //             var end;

    //             return mail.search(['ALL', ['SINCE', start]]).then(function reachLimit(fetchedUids) {
    //                 uids = fetchedUids.concat(uids);
    //                 if (uids.length >= limit) {
    //                     uids.splice(29, uids.length - limit);
    //                     return uids;
    //                 } else {
    //                     end = new Date(start.getTime());
    //                     daysToFetch *= 2;
    //                     start = new Date(end.getTime() - (1000 * 3600 * 24 * daysToFetch));
    //                     return mail.search(['ALL', ['SINCE', start], ['BEFORE', end]]).then(reachLimit);
    //                 }
    //             });
    //         }).then(function (uids) {
    //             return mail.fetch(uids, {}, {
    //                 fields: ['date', 'message-id', 'to', 'from', 'subject'],
    //                 body: false,
    //             });
    //         }).then(function (emails) {
    //             emails.sort(function emailCompare(a, b) {
    //                 var aD = new Date(a.date);
    //                 var bD = new Date(b.date);
    //                 return -(aD.getTime() - bD.getTime());
    //             });
    //             res.json(emails);
    //         }).fail(function (err) {
    //             res.json(err);
    //         }).
    //         finally(function () {
    //             mail.closeBox();
    //         });
    //     });
    // });

    app.get('/boxes/:boxId/:mailId', function (req, res) {
        mail.open(req.params.boxId, true).then(function () {
            console.log('Fetching email: ', req.params.mailId);
            return mail.fetch(req.params.mailId, {}, {
                // headers: {
                //     parse: false
                // },
                // body: true,
            });
        })
        // .then(function (email) {
        //     console.log(email);
        //     var part = walkParts(email[0].structure, 'text', 'html');
        //     if (!part) {
        //         part = walkParts(email[0].structure, 'text', 'plain');
        //     }
        //     return mail.fetch(req.params.mailId, {}, {
        //         id: part,
        //     },true).then(function (body) {
        //         email[0].html = body;
        //         return email;
        //     });
        // })
        .then(function (email) {
            console.log('Email: ', email[0].uid);
            res.json(email[0]);
        }).fail(function (err) {
            console.error(err);
            res.json(err);
        }).
        finally(function () {
            mail.closeBox().fail(function (err) {
                console.error(err);
            });
        });
    });

    app.get('/boxes/:boxId/:mailId/labels', function (req, res) {
        mail.open(req.params.boxId, true).then(function () {
            return mail.fetch(req.params.mailId, {}, {});
        }).then(function (email) {
            res.json(email[0]['x-gm-labels']);
        }).fail(function (err) {
            res.json(err);
        }).
        finally(function () {
            mail.closeBox();
        });
    });

    app.post('/boxes/:boxId/:mailId/labels', function (req, res) {
        mail.open(req.params.boxId).then(function () {
            return mail.fetch(req.params.mailId, {}, {});
        }).then(function (mails) {
            return mails[0].addLabels(req.body);
        }).then(function (labels) {
            res.json(labels);
        }).fail(function (err) {
            res.json(err);
        }).
        finally(function () {
            mail.open(req.params.boxId, true).then(mail.closeBox());

        });
    });
    app.listen(3000);
    console.log('Listening on port 3000');

});
