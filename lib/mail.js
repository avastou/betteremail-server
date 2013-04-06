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

    var fetch = function fetch(src, opt, req) {
        var d = Q.defer(),
            mails = [],
            count = 1,
            reqDefault = {
                headers: {
                    parse:false
                },
                body: true,
            };
        req.cb = function (fetch) {
            fetch.on('message', function (msg) {

                parser = new MailParser();
                var email = '',
                    headers;
                msg.on('headers', function (hdr) {
                    if( typeof hdr === 'string' ) {
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
                    count++;
                    mails.push(newMail);
                });

                msg.on('data', function (chunk) {
                    parser.write(chunk);
                    email += chunk;
                });
                msg.on('end', function () {
                    parser.end();
                    console.log(msg);

                });

            });
        };
        _.defaults(req, reqDefault);
        imap.fetch(src, opt, req, function (err) {
            if (err) {
                d.reject(err);
                return;
            }
            parser.on('end', function () {
                d.resolve(mails);
            });

        });
        return d.promise;
    };

    return {
        connect: connect,
        boxes: boxes,
        open: Q.denodeify(imap.openBox.bind(imap)),
        search: Q.denodeify(imap.search.bind(imap)),
        fetch: fetch,
        logout: Q.denodeify(imap.logout.bind(imap)),
        status: Q.denodeify(imap.status.bind(imap))
    };
};

module.exports = mail;
