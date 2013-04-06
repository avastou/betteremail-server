'use strict';

var express = require('express');
var app = express();
var getMailer = require('./lib/mail');
var config = require('./config.json');

var mail = getMailer(config);

app.configure(function () {
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(function (req, res, next) {
        var oneof = false;
        console.log('asdasdasdad');

        if (req.headers.origin) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            oneof = true;
        }
        if (req.headers['access-control-request-method']) {
            res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
            oneof = true;
        }
        if (req.headers['access-control-request-headers']) {
            res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
            oneof = true;
        }
        if (oneof) {
            res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
        }
        console.log(req.headers, res.headers);
        // intercept OPTIONS method
        if (oneof && req.method === 'OPTIONS') {
            res.send(200);
        } else {
            next();
        }
    });
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
            console.log(JSON.stringify(out));
            res.json(out);


        }, function (err) {
            console.log('errore', err);
            res.json(err);
        });

    });

    app.get('/boxes/:boxId', function (req, res) {
        mail.status(req.params.boxId).then(function (box) {
            res.json(box);
        }).fail(function (err) {
            res.json(err);
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

    app.get('/boxes/:boxId/all', function (req, res) {
        var mail = getMailer(config);
        mail.connect().then(function () {
            mail.open(req.params.boxId).then(function () {
                return mail.search(['ALL']);
            }).then(function (uids) {
                return mail.fetch(uids, {}, {
                    fields: ['date','message-id','to','from','subject'],
                    body: false,
                });
            }).then(function (emails) {
                res.json(emails);
            }).fail(function (err) {
                res.json(err);
            });
        });
    });

    app.get('/boxes/:boxId/:mailId', function (req, res) {
        mail.open(req.params.boxId).then(function () {
            return mail.fetch(req.params.mailId, {}, {});
        }).then(function (email) {
            res.json(email[0]);
        }).fail(function (err) {
            res.json(err);
        });
    });

    app.get('/boxes/:boxId/:mailId/labels', function (req, res) {
        mail.open(req.params.boxId).then(function () {
            return mail.fetch(req.params.mailId, {}, {});
        }).then(function (email) {
            res.json(email[0]['x-gm-labels']);
        }).fail(function (err) {
            res.json(err);
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
        });
    });
    app.listen(3000);
    console.log('Listening on port 3000');

});
