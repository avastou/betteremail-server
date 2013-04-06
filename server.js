'use strict';
var mail = require('./lib/mail')({
    user: 'artoale@gmail.com',
    password: '10mpmlt05'
});

mail.connect()
    .then(function () {
    console.log('Connected to gmail');
    mail.boxes().then(function (boxes) {console.log(boxes);});
    return mail.open('INBOX');
})
.then(function (box) {
    console.log('Inbox opened: ', box.name);
    return mail.search(['ALL', ['SINCE', new Date(2013, 3, 1, 20)],['X-GM-LABELS','eurecom']]);
})
.then(function (uids) {
    var total = uids.length,
        partial = 0;

    console.log('Start Fetching:', uids);
    return mail.fetch(uids, {}, {
        body: false,
    }).progress(function (mail) {
        partial += 1;
        console.log('Recived ' + partial + ' of ' + total + ' emails (', mail.from[0],')');

    });
})
.then(function (mails) {
    console.log('' + mails.length + ' emails recived');
})
.fail(function (err) {
    console.error(err);
})
.finally(function (what) {
    if (what) {
        console.log('exiting', what);
    }
    console.log('Job Completed');
    mail.logout();
    //process.exit();

});
