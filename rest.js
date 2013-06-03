'use strict';

var express = require('express'),
    app = express(),
    getMailer = require('./lib/mail'),
    config;
try {
    var config = require('./config.json');
} catch (e) {
    console.error('Unable to find config.json for user access');
    process.exit(1);
}

var mail = getMailer(config);

module.exports = function (syncManager, clusterManager, baseModel, emails) {
    app.configure(function () {
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(require('./cors'));
        app.use(app.router);

    });
    app.get('/emails/:messageId', function (req, res) {
        emails.getByMessageId(req.params.messageId)
            .then(function (email) {
                res.json(email);
            })
            .fail(function (err) {
                console.error('[ERROR]',err);
                res.json({
                    err: 'Message id specified doesn\'t exists'
                });
            });
    });
    app.get('/clusters/:boxId', function (req, res) {
        baseModel._getAll('emails', {
            'annotations': {
                '$exists': true
            },
            'x-gm-labels': req.params.boxId,
        }).then(function (emails) {
            var clusters = clusterManager.divideEmails(emails);
            res.json(clusters.filter(function (cluster) {
                return cluster.length > 0;
            }));
        }).fail(function (err) {
            console.error('[ERROR]', err);
            res.json({
                err: 'Box doesn\'t exists'
            });
        });
    });

    app.post('/clusters/:boxId',function(req, res) {
        //TODO implement
        res.json('saving cluster...');
        console.warn('CLUSTER SAVING IS NOT IMPLEMENTED DIRECTLY');
        console.warn('BACKEND LOGIC IS REQUIRED');
    });

    app.get('/sync/:boxId', function (req, res) {
        syncManager.syncBox(req.params.boxId).then(function () {
            console.log('Sync Complete');
        }, function (err) {
            console.error('[ERROR]', err);
        });
        res.json({
            msg: 'syncing'
        });
    });

    return mail.connect().then(function () {

        app.get('/boxes', function (req, res) {
            mail.boxes().then(function (boxes) {
                var out = [];
                console.log(boxes);
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



        app.get('/boxes/:boxId/:mailId', function (req, res) {
            mail.open(req.params.boxId, true).then(function () {
                console.log('Fetching email: ', req.params.mailId);
                return mail.fetch(req.params.mailId, {}, {

                });
            })

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

        app.post('/boxes/:boxId/emails', function (req, res) {
            var messages = req.body.filter(function (messageId) {
                return (typeof messageId === 'string');
            });
            emails.addLabel(messages,req.params.boxId).then(function (emails) {
                res.json({added: emails});
            }).fail(function (err){
                console.error('[ERROR]',err);
                res.json({
                    err: err
                });
            });

        });

        app.delete('/boxes/:boxId', function (req, res) {
            emails.removeLabel(req.params.boxId).then(function (emails) {
                res.json({changed: emails});
            }).fail(function (err){
                console.error('[ERROR]',err);
                res.json({
                    err: err
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
        return app;
    });
};
