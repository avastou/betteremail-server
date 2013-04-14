'use strict';
var Imap = require('imap'),
    Q = require('q'),
    _ = require('underscore')._,
    makeMailMsg = require('./mailMsg'),
    MailParser = require('mailparser').MailParser;



/**
 * Create and configure a new mail object
 * @param  {Object} config user and password must be provided
 * @return {[type]}        [description]
 */
var mail = function mail(config) {
    var options = {},
    imap;

    _.extend(options, {
        port: 993,
        secure: true,
        host: 'imap.gmail.com',
        gmail: true,
        limitHeader: true,
    }, config);
    imap = new Imap(options);
    var parser = new MailParser();



    var boxes = Q.denodeify(imap.getBoxes.bind(imap));

    var connect = function connect() {
        var deferred = Q.defer();
        imap.connect(function (err) {
            if (err) {
                deferred.reject(err);
                return;
            }
            deferred.resolve();
        });
        return deferred.promise;
    };

    var fetch = function fetch(src, opt, req, rawPart) {
        var d = Q.defer(),
            mails = [],
            reqDefault = {
                headers: {
                    parse: false
                },
                body: true,
            };
        req.cb = function (fetch) {
            fetch.on('message', function (msg) {

                parser = new MailParser({
                    streamAttachments: true,
                });
                var email = '',
                    headers;
                msg.on('headers', function (hdr) {
                    if (typeof hdr === 'string') {
                        parser.write(hdr);
                    } else {
                        parser.write(hdr.toString());
                    }

                });
                parser.on('end', function (mail) {
                    var newMail = mail;
                    if (options.gmail) {
                        newMail = makeMailMsg(mail, msg, imap);
                    }
                    _.extend(newMail.headers, headers);
                    d.notify(newMail);
                    mails.unshift(newMail);
                });

                msg.on('data', function (chunk) {
                    if (rawPart) {
                        email += chunk;
                    } else {
                        parser.write(chunk);
                    }

                });
                msg.on('end', function () {

                    if (rawPart) {
                        d.notify(email);
                        mails.unshift(email);
                    } else {
                        parser.end();
                    }

                });

            });
        };
        _.defaults(req, reqDefault);
        // console.log(req);
        imap.fetch(src, opt, req, function (err) {
            if (err) {
                d.reject(err);
                return;
            }
            if (rawPart) {
                d.resolve(mails);
            } else {
                parser.on('end', function () {
                    d.resolve(mails);
                });
            }

        });
        return d.promise;
    };

    return {
        connect: connect,
        boxes: boxes,
        open: Q.denodeify(imap.openBox.bind(imap)),
        closeBox: Q.denodeify(imap.closeBox.bind(imap)),
        search: Q.denodeify(imap.search.bind(imap)),
        sort: Q.denodeify(imap.sort.bind(imap)),
        fetch: fetch,
        logout: Q.denodeify(imap.logout.bind(imap)),
        status: Q.denodeify(imap.status.bind(imap))
    };
};

module.exports = mail;
