'use strict';
var clusterfck = require('clusterfck');

function normalize(x) {
    return 1 - (1 / (1 + x));
}
var unique = function (vett1) {
    var unique = [];
    vett1.forEach(function (el) {
        if (unique.indexOf(el) === -1) {
            unique.push(el);
        }
    });
    return unique;
};
var intersect = function intersect(a1, a2) {
    // var len = Math.max(email1.annotation.length, email2.annotation.length);
    // var count = 0;
    var a = [],
        intersection = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            intersection.push(a2[i]);
        }
    }

    return unique(intersection);

};

var annotationDistance = function (a1, a2) {
    var a = {},
        sum = 0;
    for (var i = 0; i < a1.length; i++) {
        if (a1[i].nerdType) {
            if (a[a1[i].nerdType]) {
                a[a1[i].nerdType]++;
            } else {
                a[a1[i].nerdType] = 1;
            }
        }
    }

    for (i = 0; i < a2.length; i++) {
        if (a2[i].nerdType) {
            if (a[a2[i].nerdType] > 0) {
                sum++;
                a[a2[i].nerdType]--;
            }
        }
    }

    return sum * sum * sum / 3;
};

var entityLabelDistance = function (e1, e2) {
    var l1, l2, inter;
    l1 = e1.annotations.map(function (annotation) {
        return annotation.label.toUpperCase();
    });
    l2 = e2.annotations.map(function (annotation) {
        return annotation.label.toUpperCase();
    });

    inter = intersect(l1, l2).length;
    // console.log('entity', inter, JSON.stringify(intersect(l1, l2)));
    return inter * inter  / 3;


};
var peopleIntersection = function (e1, e2) {
    function filtro(addr) {
        return addr.address;
    }
    var to1 = e1.to || [];
    var to2 = e2.to || [];
    var from1 = e1.from || [];
    var from2 = e2.from || [];
    var p1 = to1.map(filtro).concat(from1.map(filtro)),
        p2 = to2.map(filtro).concat(from2.map(filtro));
    var inter = intersect(p1, p2).length;
    if (inter === 1) {
        return 0;
    }
    // console.log('people', inter);
    return inter * inter * inter / 3;
};

var dateDistance = function (e1, e2) {
    var d = e1.text.length + e2.text.length;
    return d*d*d /3;
    var d1 = new Date(e1.date);
    var d2 = new Date(e2.date);
    var date = Math.abs(d1 - d2);
    return date * date * date / 3;
};


var subjectDistance = function (e1, e2) {
    if (e1.subject && e2.subject) {
        var d = (1 - normalize(new Levenshtein(e1.subject, e2.subject).distance)) * 15;
        return d * d * d / 3;
    }
    return 0;

};
var distanceH = function (email1, email2) {
    var coeff = [{
            val: annotationDistance(email1.annotations, email2.annotations),
            weigth: 0.2
        }, {
            val: peopleIntersection(email1, email2),
            weigth: 0.4
        }, {
            val: dateDistance(email1, email2),
            weigth: 0.2
        }, {
            val: entityLabelDistance(email1, email2),
            weigth: 0.2
        }];

    return 1 - coeff.reduce(function (sum, elem) {
        return sum + normalize(elem.val) * elem.weigth;
    }, 0);
};

var distanceKM = function (email1, email2) {
    var coeff = [{
            val: annotationDistance(email1.annotations, email2.annotations),
            weigth: 0
        }, {
            val: peopleIntersection(email1, email2),
            weigth: 0.3
        }, {
            val: dateDistance(email1, email2),
            weigth: 0.2
        }, {
            val: entityLabelDistance(email1, email2),
            weigth: 0.5
        }];

    return 1 - coeff.reduce(function (sum, elem) {
        return sum + normalize(elem.val) * elem.weigth;
    }, 0);
};

module.exports = function () {
    return {
        hierarchical: function (emails) {
            var clusters = clusterfck.hcluster(emails, distanceH, 'average');
            return clusters;
        },
        kmeans: function (emails, ctd) {
            var k = ctd ? ctd.length : Math.floor(Math.sqrt(emails.length / 2));
            var clusters = clusterfck.kmeans(emails, k, distanceKM, ctd);
            return clusters;
        }
    };
};
