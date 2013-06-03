'use strict';
var di = require('di'),
    nerd = require('nerd4node'),
    m = module.exports = new di.Module(),
    injector,
    config;

m.value('nerd', nerd);
try {
    config = require('../config.json');
} catch (e) {
    console.error('Unable to find config.json for user access');
    process.exit(1);
}
m.value('apiKey', config.NERDKey );
m.factory('annotate', require('../clustering/annotate'));

injector = new di.Injector([m, require('./model.js')]);
var annotator = injector.get('annotate');
var baseModel = injector.get('baseModel');
var batchSize = 15;


function annotateEmails(emails) {
    var ps = [];
    var annotatedEmails = [];
    console.log('Emails to annotate: ', emails.length);
    emails.forEach(function (email, index) {
        if (email.text && index <= batchSize) {
            console.log('Annotating ' + (index + 1) + ' of ' + emails.length);
            ps.push(annotator.annotate(email.text).then(function (annotations) {
                console.log('annotated ' + (index + 1) + ' of ' + emails.length);
                email.annotations = annotations;
                annotatedEmails.push(email);
                return email;
            }, function (err) {
                console.log(JSON.stringify(err));
                if (err.code && err.code === 400 && email.text.length <= 100) {
                    email.annotations = [];
                    annotatedEmails.push(email);
                } else if (err.indexOf('SyntaxError: Unexpected token o') >= 0) {
                    email.annotations = [];
                    annotatedEmails.push(email);
                }
                console.error('[ERROR] [ANNOTATION]', err);
            }));
        } else if (index > batchSize) {
            console.log('INDICE ALTO!!!');
        }
    });
    return require('q').allResolved(ps).then(function () {
        var promisesUpdate = [];
        console.log('Annotated ', annotatedEmails.length + ' emails');
        annotatedEmails.forEach(function (email) {
            promisesUpdate.push(baseModel._update(email, 'emails'));
        });
        return require('q').allResolved(promisesUpdate).then(function () {
            console.log('Updated ', annotatedEmails.length + ' emails');
        });

    }, function (err) {
        console.error('[ERROR]', err);
    }).fail(function (err) {
        console.error('[ERROR]', err);
    }).then(function () {
        return emails;
    });
}

function doAnnotate() {
    return baseModel._getAll('emails', {
        'annotations': {
            '$exists': false
        },
        'text': {
            '$exists': true
        },
    }, batchSize).then(annotateEmails);
}

function wait(value){
    var deferred = require('q').defer();
    console.log('Timeout started');
    setTimeout(function (){
        console.log('Timeout elapsed');
        deferred.resolve(value);
    },4000);
    return deferred.promise;
}



doAnnotate().then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)
    .then(doAnnotate).then(wait)

    .then(doAnnotate).finally(function () {
        console.log('Complete!');
    });
