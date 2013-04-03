'use strict';

var express = require('express');
var app = express();
var mail = require('./lib/mail')({
    user: 'artoale@gmail.com',
    password: '10maggio@@@',
});

app.configure(function () {
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.errorHandler());
    app.use(express.methodOverride());
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
        mail.open(req.params.boxId).then(function (box) {
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
                    parse:false,
                }
            });
        }).then(function (emails) {
            res.json(emails);
        }).fail(function (err) {
            res.json(err);
        });
    });

    app.get('/boxes/:boxId/all', function (req, res) {
        mail.open(req.params.boxId).then(function () {
            return mail.search(['ALL']);
        }).then(function (uids) {
            return mail.fetch(uids, {}, {
                body: false,
                headers: {
                    fields: true,
                    parse:false,
                }
            });
        }).then(function (emails) {
            res.json(emails);
        }).fail(function (err) {
            res.json(err);
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
        }).then(function(labels){
            res.json(labels);
        }).fail(function (err) {
            res.json(err);
        });
    });
    app.listen(3000);
    console.log('Listening on port 3000');

});
